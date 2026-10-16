import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPublicClient, createWalletClient, http, isAddress, keccak256, parseEventLogs, parseEther, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";
import { ticketContractAbi, ticketContractAddress } from "../../../lib/ticket-contract";

const mintRequestSchema = z.object({
  ticketId: z.string().uuid(),
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
}).strict();

const sepolia = {
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("authorization");
    const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    const parsedBody = mintRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid mint request" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
      return NextResponse.json({ error: "Server-side Supabase credentials are not configured" }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const { ticketId, to } = parsedBody.data;
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id,order_id,ticket_type_id,status,token_id,nft_tx_hash")
      .eq("id", ticketId)
      .maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,status")
      .eq("id", ticket.order_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.status !== "PAID") {
      return NextResponse.json({ error: "A paid ticket order is required" }, { status: 403 });
    }
    if (ticket.token_id !== null) {
      return NextResponse.json({
        success: true,
        alreadyMinted: true,
        transactionHash: ticket.nft_tx_hash,
        tokenId: ticket.token_id.toString(),
        contractAddress: ticketContractAddress,
      });
    }
    if (ticket.status !== "VALID") {
      return NextResponse.json({ error: "Ticket is not eligible for minting" }, { status: 409 });
    }

    const { data: ticketType, error: ticketTypeError } = await supabase
      .from("ticket_types")
      .select("event_id")
      .eq("id", ticket.ticket_type_id)
      .maybeSingle();
    if (ticketTypeError) throw ticketTypeError;
    if (!ticketType) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: "Backend signer private key is not configured" }, { status: 503 });
    }

    if (!isAddress(to, { strict: false })) {
      return NextResponse.json({ error: "Invalid recipient address" }, { status: 400 });
    }

    const formattedKey = (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as `0x${string}`;
    const account = privateKeyToAccount(formattedKey);

    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
    const transport = http(rpcUrl);

    const publicClient = createPublicClient({
      chain: sepolia,
      transport,
    });

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport,
    });

    const defaultPrice = parseEther("0.0001");
    const uri = `ipfs://u-ticket-3/order-${order.id}/ticket-${ticket.id}.json`;

    const { data: claimed, error: claimError } = await supabase.rpc("claim_ticket_nft_mint", {
      p_ticket_id: ticketId,
    });
    if (claimError) throw claimError;
    if (!claimed) {
      return NextResponse.json({ error: "Ticket mint is already in progress or has completed" }, { status: 409 });
    }

    const txHash = await walletClient.writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "mint",
      args: [
        to as `0x${string}`,
        BigInt(ticketType.event_id),
        BigInt(ticket.ticket_type_id),
        BigInt(keccak256(toBytes(order.id))),
        defaultPrice,
        uri,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== "success") {
      const { error: releaseError } = await serviceSupabase
        .from("tickets")
        .update({ nft_minting_at: null })
        .eq("id", ticketId)
        .is("token_id", null);
      if (releaseError) throw releaseError;
      return NextResponse.json({ error: "Mint transaction reverted" }, { status: 502 });
    }

    const mintedEvent = parseEventLogs({
      abi: ticketContractAbi,
      logs: receipt.logs,
      eventName: "TicketMinted",
      strict: true,
    })[0];
    const tokenId = mintedEvent?.args.tokenId.toString() ?? null;
    if (
      !tokenId
      || mintedEvent.address.toLowerCase() !== ticketContractAddress.toLowerCase()
      || mintedEvent.args.owner.toLowerCase() !== to.toLowerCase()
      || mintedEvent.args.eventId !== BigInt(ticketType.event_id)
      || mintedEvent.args.orderId !== BigInt(keccak256(toBytes(order.id)))
    ) {
      console.error("Mint transaction succeeded without the expected ticket event", txHash);
      return NextResponse.json({ error: "Minted ticket ID could not be confirmed" }, { status: 502 });
    }

    const { error: linkError } = await serviceSupabase.rpc("link_ticket_nft", {
      p_ticket_id: ticketId,
      p_token_id: tokenId,
      p_tx_hash: txHash,
    });
    if (linkError) throw linkError;

    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      tokenId,
      contractAddress: ticketContractAddress,
    });
  } catch (error: unknown) {
    console.error("NFT Mint Error:", error);
    return NextResponse.json({ error: "Failed to mint NFT" }, { status: 500 });
  }
}
