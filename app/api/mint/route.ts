import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
const sepolia = {
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
  },
} as const;
import { ticketContractAbi, ticketContractAddress } from "../../../lib/ticket-contract";

export async function POST(req: NextRequest) {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: "Backend signer private key not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { to, eventId, ticketType, orderId, metadataURI } = body;

    if (!to || !eventId || !ticketType || !orderId) {
      return NextResponse.json({ error: "Missing required mint parameters" }, { status: 400 });
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
    const uri = metadataURI || `ipfs://u-ticket-3/event-${eventId}-order-${orderId}.json`;

    const txHash = await walletClient.writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "mint",
      args: [
        to as `0x${string}`,
        BigInt(eventId),
        BigInt(ticketType),
        BigInt(orderId),
        defaultPrice,
        uri,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    let tokenId: string | null = null;
    for (const log of receipt.logs) {
      if (log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
        if (log.topics[3]) {
          tokenId = BigInt(log.topics[3]).toString();
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      tokenId: tokenId || "1",
      contractAddress: ticketContractAddress,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to mint NFT";
    console.error("NFT Mint Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
