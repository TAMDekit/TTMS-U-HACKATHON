"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, ShieldCheck, ShoppingCart, Tag, Ticket as TicketIcon, Wallet } from "lucide-react";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance, useConnect, useReadContract, useReadContracts, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatPriceFromCents } from "../lib/currency";
import { getPublishedEvents, type LiveEvent, type TicketType } from "../lib/events";
import { getLocalDemoTickets, saveLocalDemoTickets, type Ticket } from "../lib/orders";
import { ticketContractAbi, ticketContractAddress } from "../lib/ticket-contract";

const zeroAddress = "0x0000000000000000000000000000000000000000";
const scanLimit = 100;

function formatEth(value: bigint) {
  return `${Number(formatEther(value)).toLocaleString("en-US", { maximumFractionDigits: 6 })} ETH`;
}

function LegacyMarketplaceView({ lang }: { lang: "en" | "th" }) {
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { switchChain } = useSwitchChain();
  const { data: balance, isLoading: balanceLoading, isError: balanceError } = useBalance({
    address,
    chainId: sepolia.id,
    query: { enabled: Boolean(address), refetchInterval: 10_000 },
  });
  const { data: nextToken, isLoading: tokenCountLoading, isError: tokenCountError } = useReadContract({
    address: ticketContractAddress,
    abi: ticketContractAbi,
    functionName: "nextTokenId",
    chainId: sepolia.id,
    query: { refetchInterval: 10_000 },
  });
  const tokenCount = nextToken ? Number(nextToken) - 1 : 0;
  const firstTokenId = Math.max(1, tokenCount - scanLimit + 1);
  const tokenIds = Array.from({ length: Math.max(0, tokenCount - firstTokenId + 1) }, (_, index) => firstTokenId + index);
  const contracts = tokenIds.flatMap((tokenId) => [
    { address: ticketContractAddress, abi: ticketContractAbi, functionName: "listings" as const, args: [BigInt(tokenId)] as const, chainId: sepolia.id },
    { address: ticketContractAddress, abi: ticketContractAbi, functionName: "ownerOf" as const, args: [BigInt(tokenId)] as const, chainId: sepolia.id },
    { address: ticketContractAddress, abi: ticketContractAbi, functionName: "tickets" as const, args: [BigInt(tokenId)] as const, chainId: sepolia.id },
  ]);
  const listingsQuery = useReadContracts({
    contracts,
    query: { enabled: tokenIds.length > 0, refetchInterval: 10_000 },
  });
  const { writeContract, data: txHash, isPending, error: txError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });
  const [buyingToken, setBuyingToken] = useState<number | null>(null);

  const listings = tokenIds.flatMap((tokenId, index) => {
    const listingResult = listingsQuery.data?.[index * 3];
    const ownerResult = listingsQuery.data?.[index * 3 + 1];
    const ticketResult = listingsQuery.data?.[index * 3 + 2];
    const listing = listingResult?.status === "success"
      ? listingResult.result as readonly [`0x${string}`, bigint]
      : undefined;
    const owner = ownerResult?.status === "success" ? ownerResult.result as string : undefined;
    const ticket = ticketResult?.status === "success"
      ? ticketResult.result as readonly [bigint, bigint, bigint, boolean]
      : undefined;

    if (!listing || !owner || !ticket || listing[0].toLowerCase() === zeroAddress || owner.toLowerCase() !== listing[0].toLowerCase() || ticket[3]) {
      return [];
    }

    return [{ tokenId, seller: listing[0], priceWei: listing[1] }];
  });
  const totalListingValue = listings.reduce((total, listing) => total + listing.priceWei, BigInt(0));
  const isSepolia = chainId === sepolia.id;

  const buyListing = (tokenId: number) => {
    const listing = listings.find((item) => item.tokenId === tokenId);
    if (!listing) return;
    if (!isConnected) {
      connect({ connector: connectors[0] });
      return;
    }
    if (!isSepolia) {
      switchChain({ chainId: sepolia.id });
      return;
    }
    setBuyingToken(tokenId);
    writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "buy",
      args: [BigInt(tokenId)],
      value: listing.priceWei,
      chainId: sepolia.id,
    });
  };

  return (
    <section className="marketplace-page">
      <div className="marketplace-heading">
        <div>
          <span className="marketplace-kicker">U TICKET 3 / SEPOLIA</span>
          <h1>{lang === "th" ? "ตลาดซื้อขายตั๋ว" : "Ticket marketplace"}</h1>
          <p>{lang === "th" ? "รายการและราคาที่อ่านจาก Ethereum Sepolia โดยตรง" : "Live listings and prices read directly from Ethereum Sepolia."}</p>
        </div>
        <a href={`https://sepolia.etherscan.io/address/${ticketContractAddress}`} target="_blank" rel="noreferrer" className="marketplace-contract-link">
          <ExternalLink size={15} /> {lang === "th" ? "ดูสัญญาบน Etherscan" : "View contract"}
        </a>
      </div>

      <div className="marketplace-proof-grid">
        <div className="marketplace-proof-card">
          <div className="marketplace-proof-label"><Wallet size={15} /> {lang === "th" ? "ยอดในกระเป๋า Sepolia" : "Connected wallet balance"}</div>
          <strong>{!isConnected ? "—" : balanceLoading ? "…" : balanceError ? (lang === "th" ? "อ่านยอดไม่ได้" : "Unavailable") : balance ? `${Number(formatEther(balance.value)).toLocaleString("en-US", { maximumFractionDigits: 6 })} ${balance.symbol}` : "—"}</strong>
          <span>{!isConnected ? (lang === "th" ? "เชื่อมต่อกระเป๋าเพื่อดูยอดจริง" : "Connect a wallet to see its live balance") : `${address?.slice(0, 6)}…${address?.slice(-4)} · Sepolia testnet`}</span>
          {!isConnected && <button type="button" className="marketplace-connect" disabled={!connectors[0]} onClick={() => connectors[0] && connect({ connector: connectors[0] })}>{lang === "th" ? "เชื่อมต่อกระเป๋า" : "Connect wallet"}</button>}
        </div>
        <div className="marketplace-proof-card">
          <div className="marketplace-proof-label"><ShieldCheck size={15} /> {lang === "th" ? "มูลค่ารายการขาย" : "Value listed for sale"}</div>
          <strong>{formatEth(totalListingValue)}</strong>
          <span>{lang === "th" ? "ยอดรวมราคา listing ที่ยัง active บนเชน ไม่ใช่เงิน escrow" : "Sum of active on-chain prices; funds are not held in escrow."}</span>
        </div>
        <div className="marketplace-network-card">
          <span className="marketplace-live-dot" />
          <div><strong>Ethereum Sepolia</strong><span>{lang === "th" ? "เครือข่ายทดสอบ · ไม่ใช่เงินบาทหรือเงินจริง Mainnet" : "Test network · not fiat or Ethereum mainnet funds"}</span></div>
          <b>11155111</b>
        </div>
      </div>

      <div className="marketplace-list-heading">
        <div><h2>{lang === "th" ? "ตั๋วที่กำลังประกาศขาย" : "Active ticket listings"}</h2><span>{listings.length} {lang === "th" ? "รายการที่ตรวจสอบแล้ว" : "verified listings"}</span></div>
        <button type="button" className="marketplace-refresh" onClick={() => { void listingsQuery.refetch(); }} aria-label="Refresh listings" title="Refresh listings"><RefreshCw size={16} /></button>
      </div>

      {tokenCountLoading || listingsQuery.isLoading ? (
        <div className="marketplace-empty">{lang === "th" ? "กำลังอ่านข้อมูลจากบล็อกเชน…" : "Reading live blockchain data…"}</div>
      ) : tokenCountError || listingsQuery.isError ? (
        <div className="marketplace-empty marketplace-error">{lang === "th" ? "อ่านข้อมูล Sepolia ไม่สำเร็จ ตรวจสอบ RPC URL และลองอีกครั้ง" : "Could not read Sepolia data. Check the RPC URL and try again."}</div>
      ) : listings.length === 0 ? (
        <div className="marketplace-empty">{lang === "th" ? "ยังไม่มี listing ที่ active บนสัญญานี้" : "No active listings found on this contract."}</div>
      ) : (
        <div className="marketplace-listings">
          {listings.map((listing) => (
            <article className="marketplace-listing" key={listing.tokenId}>
              <div className="marketplace-ticket-mark"><span>UT3</span><b>#{listing.tokenId.toString().padStart(4, "0")}</b></div>
              <div className="marketplace-listing-info"><span className="marketplace-verified"><ShieldCheck size={13} /> ON-CHAIN LISTING</span><h3>{lang === "th" ? `ตั๋ว NFT หมายเลข ${listing.tokenId}` : `Ticket NFT #${listing.tokenId}`}</h3><span>Seller {listing.seller.slice(0, 8)}…{listing.seller.slice(-6)}</span></div>
              <div className="marketplace-price"><span>{lang === "th" ? "ราคาบนเชน" : "On-chain price"}</span><strong>{formatEth(listing.priceWei)}</strong><a href={`https://sepolia.etherscan.io/token/${ticketContractAddress}?a=${listing.tokenId}`} target="_blank" rel="noreferrer">{lang === "th" ? "ตรวจสอบ NFT" : "Verify NFT"} <ExternalLink size={12} /></a></div>
              <button type="button" className="marketplace-buy" onClick={() => buyListing(listing.tokenId)} disabled={isPending || isConfirming || (isConnected && listing.seller.toLowerCase() === address?.toLowerCase())}>
                {!isConnected ? (lang === "th" ? "เชื่อมต่อกระเป๋า" : "Connect wallet") : !isSepolia ? (lang === "th" ? "เปลี่ยนเป็น Sepolia" : "Switch to Sepolia") : isPending && buyingToken === listing.tokenId ? (lang === "th" ? "รอยืนยัน…" : "Confirm in wallet…") : isConfirming && buyingToken === listing.tokenId ? (lang === "th" ? "กำลังยืนยัน…" : "Confirming…") : lang === "th" ? "ซื้อตั๋ว" : "Buy ticket"}
              </button>
            </article>
          ))}
        </div>
      )}

      {txConfirmed && txHash && <p className="marketplace-transaction">{lang === "th" ? "ธุรกรรมสำเร็จ" : "Purchase confirmed"}: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash.slice(0, 12)}… <ExternalLink size={12} /></a></p>}
      {txError && <p className="marketplace-transaction marketplace-error">{txError.message}</p>}
      {tokenCount > scanLimit && <p className="marketplace-footnote">{lang === "th" ? `กำลังตรวจ ${scanLimit} token ล่าสุดจากทั้งหมด ${tokenCount} token` : `Scanning the latest ${scanLimit} of ${tokenCount} minted tokens.`}</p>}
    </section>
  );
}

type TicketOption = { event: LiveEvent; ticket: TicketType };
type OnChainTicket = {
  tokenId: number;
  seller: `0x${string}`;
  owner: `0x${string}`;
  eventId: number;
  ticketTypeId: number;
  checkedIn: boolean;
  priceWei: bigint;
  originalPriceWei: bigint;
};
type DemoProfile = "user-a" | "user-b";

export default function MarketplaceView() {
  const [tab, setTab] = useState<"primary" | "resale" | "owned">("primary");
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [eventId, setEventId] = useState("");
  const [ticketTypeId, setTicketTypeId] = useState("");
  const [primaryPrice, setPrimaryPrice] = useState("");
  const [primarySupply, setPrimarySupply] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [resalePrices, setResalePrices] = useState<Record<number, string>>({});
  const [actionError, setActionError] = useState("");
  const [buyingToken, setBuyingToken] = useState<number | null>(null);
  const [demoProfile, setDemoProfile] = useState<DemoProfile>("user-a");
  const [demoTickets, setDemoTickets] = useState<Ticket[]>([]);
  const [demoResalePrices, setDemoResalePrices] = useState<Record<string, string>>({});
  const [demoNotice, setDemoNotice] = useState("");

  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { switchChain } = useSwitchChain();
  const { data: balance, isLoading: balanceLoading, isError: balanceError } = useBalance({
    address,
    chainId: sepolia.id,
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });
  const { data: contractOwner } = useReadContract({
    address: ticketContractAddress,
    abi: ticketContractAbi,
    functionName: "owner",
    chainId: sepolia.id,
  });
  const { data: nextToken, isLoading: tokenCountLoading, isError: tokenCountError } = useReadContract({
    address: ticketContractAddress,
    abi: ticketContractAbi,
    functionName: "nextTokenId",
    chainId: sepolia.id,
    query: { refetchInterval: 15_000 },
  });
  const { writeContract, data: txHash, isPending, error: txError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    let active = true;
    setEventsLoading(true);
    getPublishedEvents()
      .then((loadedEvents) => {
        if (active) setEvents(loadedEvents);
      })
      .catch((error: unknown) => {
        if (active) setEventsError(error instanceof Error ? error.message : "Published events could not be loaded.");
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const storedProfile = window.localStorage.getItem("ut3_demo_profile");
    if (storedProfile === "user-b") setDemoProfile("user-b");
    setDemoTickets(getLocalDemoTickets());
  }, []);

  const persistDemoTickets = (tickets: Ticket[]) => {
    saveLocalDemoTickets(tickets);
    setDemoTickets(tickets);
  };

  useEffect(() => {
    if (!events.length) return;
    setEventId((current) => current || String(events[0].id));
  }, [events]);

  useEffect(() => {
    const firstTicketType = events.find((event) => String(event.id) === eventId)?.ticket_types[0];
    if (firstTicketType && !ticketTypeId) setTicketTypeId(String(firstTicketType.id));
  }, [eventId, events, ticketTypeId]);

  const selectedEvent = events.find((event) => String(event.id) === eventId);
  const selectedTicketType = selectedEvent?.ticket_types.find((ticket) => String(ticket.id) === ticketTypeId);
  const ticketOptions: TicketOption[] = events.flatMap((event) => event.ticket_types.map((ticket) => ({ event, ticket })));
  const primaryContracts = ticketOptions.map(({ event, ticket }) => ({
    address: ticketContractAddress,
    abi: ticketContractAbi,
    functionName: "primarySales" as const,
    args: [BigInt(event.id), BigInt(ticket.id)] as const,
    chainId: sepolia.id,
  }));
  const primaryRead = useReadContracts({
    contracts: primaryContracts,
    query: { enabled: primaryContracts.length > 0, refetchInterval: 15_000 },
  });
  const primaryDeals = ticketOptions.flatMap((option, index) => {
    const result = primaryRead.data?.[index];
    const sale = result?.status === "success"
      ? result.result as readonly [bigint, bigint, bigint]
      : undefined;
    if (!sale || sale[0] === BigInt(0) || sale[2] >= sale[1]) return [];
    return [{ ...option, priceWei: sale[0], supply: sale[1], sold: sale[2] }];
  });
  const hasPrimaryReadFailure = Boolean(primaryRead.data?.some((result) => result.status === "failure"));

  const tokenCount = nextToken ? Number(nextToken) - 1 : 0;
  const firstTokenId = Math.max(1, tokenCount - scanLimit + 1);
  const tokenIds = Array.from({ length: Math.max(0, tokenCount - firstTokenId + 1) }, (_, index) => firstTokenId + index);
  const ticketContracts = tokenIds.flatMap((tokenId) => [
    { address: ticketContractAddress, abi: ticketContractAbi, functionName: "listings" as const, args: [BigInt(tokenId)] as const, chainId: sepolia.id },
    { address: ticketContractAddress, abi: ticketContractAbi, functionName: "ownerOf" as const, args: [BigInt(tokenId)] as const, chainId: sepolia.id },
    { address: ticketContractAddress, abi: ticketContractAbi, functionName: "tickets" as const, args: [BigInt(tokenId)] as const, chainId: sepolia.id },
    { address: ticketContractAddress, abi: ticketContractAbi, functionName: "originalPriceWei" as const, args: [BigInt(tokenId)] as const, chainId: sepolia.id },
  ]);
  const ticketRead = useReadContracts({
    contracts: ticketContracts,
    query: { enabled: tokenIds.length > 0, refetchInterval: 15_000 },
  });
  const scannedTickets: OnChainTicket[] = tokenIds.flatMap((tokenId, index) => {
    const listingResult = ticketRead.data?.[index * 4];
    const ownerResult = ticketRead.data?.[index * 4 + 1];
    const ticketResult = ticketRead.data?.[index * 4 + 2];
    const priceResult = ticketRead.data?.[index * 4 + 3];
    if (listingResult?.status !== "success" || ownerResult?.status !== "success" || ticketResult?.status !== "success" || priceResult?.status !== "success") return [];
    const listing = listingResult.result as readonly [`0x${string}`, bigint];
    const owner = ownerResult.result as `0x${string}`;
    const ticket = ticketResult.result as readonly [bigint, bigint, bigint, boolean];
    return [{
      tokenId,
      seller: listing[0],
      owner,
      eventId: Number(ticket[0]),
      ticketTypeId: Number(ticket[1]),
      checkedIn: ticket[3],
      priceWei: listing[1],
      originalPriceWei: priceResult.result as bigint,
    }];
  });
  const activeListings = scannedTickets.filter((ticket) =>
    ticket.seller.toLowerCase() !== zeroAddress &&
    ticket.owner.toLowerCase() === ticket.seller.toLowerCase() &&
    !ticket.checkedIn && ticket.priceWei > BigInt(0)
  );
  const ownedTickets = scannedTickets.filter((ticket) =>
    address && ticket.owner.toLowerCase() === address.toLowerCase()
  );
  const mockOwnedTickets = demoTickets.filter((ticket) => ticket.demo_profile === demoProfile && ticket.status === "VALID");
  const mockListings = demoTickets.filter((ticket) => ticket.status === "VALID" && (ticket.demo_resale_price_cents || 0) > 0);
  const totalListingValue = activeListings.reduce((total, listing) => total + listing.priceWei, BigInt(0));
  const isSepolia = chainId === sepolia.id;
  const isContractOwner = Boolean(address && contractOwner && String(contractOwner).toLowerCase() === address.toLowerCase());

  const prepareWallet = () => {
    if (!isConnected) {
      if (connectors[0]) connect({ connector: connectors[0] });
      else setActionError("No injected wallet is available in this browser.");
      return false;
    }
    if (!isSepolia) {
      switchChain({ chainId: sepolia.id });
      return false;
    }
    return true;
  };

  const configureSale = () => {
    setActionError("");
    if (!prepareWallet() || !selectedEvent || !selectedTicketType) return;
    const supply = Number(primarySupply);
    if (!Number.isSafeInteger(supply) || supply <= 0) {
      setActionError("Enter a valid ticket supply.");
      return;
    }
    try {
      const priceWei = parseEther(primaryPrice);
      if (priceWei <= BigInt(0)) throw new Error("Price must be greater than zero.");
      writeContract({
        address: ticketContractAddress,
        abi: ticketContractAbi,
        functionName: "setPrimarySale",
        args: [BigInt(selectedEvent.id), BigInt(selectedTicketType.id), priceWei, BigInt(supply)],
        gas: BigInt(1_000_000),
        chainId: sepolia.id,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Invalid primary-sale configuration.");
    }
  };

  const buyPrimary = (deal: (typeof primaryDeals)[number]) => {
    setActionError("");
    if (!prepareWallet()) return;
    const requestedQuantity = Number(quantity);
    if (!Number.isSafeInteger(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 10) {
      setActionError("Choose between 1 and 10 tickets.");
      return;
    }
    if (BigInt(requestedQuantity) > deal.supply - deal.sold) {
      setActionError("The selected quantity is greater than the remaining supply.");
      return;
    }
    const total = deal.priceWei * BigInt(requestedQuantity);
    if (balance && balance.value < total) {
      setActionError("Insufficient Sepolia ETH for the ticket price. Keep extra ETH for network gas.");
      return;
    }
    const metadata = `data:application/json,${encodeURIComponent(JSON.stringify({
      name: `${deal.event.title} - ${deal.ticket.name}`,
      description: `On-chain event ticket for ${deal.event.title} at ${deal.event.venue}.`,
      image: deal.event.image_url || undefined,
      attributes: [
        { trait_type: "Event ID", value: deal.event.id },
        { trait_type: "Ticket type", value: deal.ticket.name },
      ],
    }))}`;
    writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "buyPrimary",
      args: [BigInt(deal.event.id), BigInt(deal.ticket.id), BigInt(requestedQuantity), metadata],
      value: total,
      chainId: sepolia.id,
    });
  };

  const buyResale = (listing: OnChainTicket) => {
    setActionError("");
    if (!prepareWallet()) return;
    setBuyingToken(listing.tokenId);
    writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "buy",
      args: [BigInt(listing.tokenId)],
      value: listing.priceWei,
      chainId: sepolia.id,
    });
  };

  const listTicket = (ticket: OnChainTicket) => {
    setActionError("");
    if (!prepareWallet()) return;
    try {
      const priceWei = parseEther(resalePrices[ticket.tokenId] || formatEther(ticket.originalPriceWei));
      const maxPrice = ticket.originalPriceWei + (ticket.originalPriceWei * BigInt(1000)) / BigInt(10000);
      if (priceWei <= BigInt(0) || priceWei > maxPrice) {
        setActionError(`Token #${ticket.tokenId} must be listed at or below ${formatEth(maxPrice)}.`);
        return;
      }
      writeContract({
        address: ticketContractAddress,
        abi: ticketContractAbi,
        functionName: "list",
        args: [BigInt(ticket.tokenId), priceWei],
        chainId: sepolia.id,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Enter a valid ETH price.");
    }
  };

  const cancelListing = (tokenId: number) => {
    setActionError("");
    if (!prepareWallet()) return;
    writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "cancelListing",
      args: [BigInt(tokenId)],
      chainId: sepolia.id,
    });
  };

  const activeTickets = (eventIdValue: string) => events.find((event) => String(event.id) === eventIdValue)?.ticket_types ?? [];

  const buyMockTicket = (event: LiveEvent, ticketType: TicketType) => {
    setDemoNotice("");
    setActionError("");
    const count = Number(quantity);
    if (!Number.isSafeInteger(count) || count < 1 || count > 10) {
      setActionError("Choose between 1 and 10 demo tickets.");
      return;
    }
    const orderId = `mock-order-${Date.now().toString(36)}`;
    const purchasedAt = new Date().toISOString();
    const purchasedTickets: Ticket[] = Array.from({ length: count }, (_, index) => {
      const ticketCode = `DEMO-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const id = `mock-ticket-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;
      return {
        id,
        order_id: orderId,
        ticket_type_id: ticketType.id,
        ticket_code: ticketCode,
        qr_payload: `ut3://demo-ticket/${ticketCode}/${orderId}`,
        status: "VALID",
        token_id: null,
        created_at: purchasedAt,
        demo_is_mock: true,
        demo_profile: demoProfile,
        demo_purchase_price_cents: ticketType.price_cents,
        demo_resale_price_cents: null,
        ticket_types: {
          id: ticketType.id,
          name: ticketType.name,
          price_cents: ticketType.price_cents,
          event_id: event.id,
          events: {
            id: event.id,
            title: event.title,
            venue: event.venue,
            starts_at: event.starts_at,
            image_url: event.image_url,
          },
        },
      };
    });
    try {
      persistDemoTickets([...purchasedTickets, ...demoTickets]);
      setDemoNotice(`${count} demo ticket${count === 1 ? "" : "s"} added to ${demoProfile === "user-a" ? "User A" : "User B"}'s tickets. No payment was taken.`);
      setTab("owned");
    } catch {
      setActionError("Could not save demo tickets in this browser.");
    }
  };

  const listMockTicket = (ticket: Ticket) => {
    const originalPrice = ticket.demo_purchase_price_cents || ticket.ticket_types?.price_cents || 0;
    const requestedPrice = Math.round(Number(demoResalePrices[ticket.id]) * 100);
    const maxPrice = Math.floor(originalPrice * 1.1);
    if (!Number.isFinite(requestedPrice) || requestedPrice <= 0 || requestedPrice > maxPrice) {
      setActionError(`Mock resale price must be between $0.01 and ${formatPriceFromCents(maxPrice, "en")}.`);
      return;
    }
    persistDemoTickets(demoTickets.map((item) => item.id === ticket.id ? { ...item, demo_resale_price_cents: requestedPrice } : item));
    setActionError("");
    setDemoNotice("Your demo ticket is listed. Switch to the other demo user to buy it.");
    setTab("resale");
  };

  const cancelMockListing = (ticketId: string) => {
    persistDemoTickets(demoTickets.map((item) => item.id === ticketId ? { ...item, demo_resale_price_cents: null } : item));
    setDemoNotice("Demo listing cancelled.");
  };

  const buyMockListing = (ticket: Ticket) => {
    if (ticket.demo_profile === demoProfile) {
      setActionError("Switch to the other demo user to buy this ticket.");
      return;
    }
    const newCode = `DEMO-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const orderId = `mock-resale-${Date.now().toString(36)}`;
    persistDemoTickets(demoTickets.map((item) => item.id === ticket.id ? {
      ...item,
      order_id: orderId,
      ticket_code: newCode,
      qr_payload: `ut3://demo-ticket/${newCode}/${orderId}`,
      created_at: new Date().toISOString(),
      demo_profile: demoProfile,
      demo_purchase_price_cents: item.demo_purchase_price_cents || item.ticket_types?.price_cents || 0,
      demo_resale_price_cents: null,
    } : item));
    setActionError("");
    setDemoNotice(`Demo ticket transferred to ${demoProfile === "user-a" ? "User A" : "User B"}. No payment was taken.`);
    setTab("owned");
  };

  return (
    <section className="marketplace-page">
      <div className="marketplace-heading">
        <div>
          <span className="marketplace-kicker">U TICKET 3 / ETHEREUM SEPOLIA</span>
          <h1>Marketplace</h1>
          <p>Buy event tickets, resell safely, and check your on-chain ETH balance.</p>
        </div>
        <a href={`https://sepolia.etherscan.io/address/${ticketContractAddress}`} target="_blank" rel="noreferrer" className="marketplace-contract-link">
          <ExternalLink size={16} /> View verified contract
        </a>
      </div>

      <div className="marketplace-proof-grid">
        <div className="marketplace-proof-card">
          <div className="marketplace-proof-label"><Wallet size={17} /> Your Sepolia wallet</div>
          <strong>{!isConnected ? "Not connected" : balanceLoading ? "Loading…" : balanceError ? "Balance unavailable" : balance ? `${formatEth(balance.value)}` : "—"}</strong>
          <span>{isConnected ? `${address?.slice(0, 8)}…${address?.slice(-6)} · Sepolia test ETH` : "Connect your wallet to see your live balance."}</span>
          {!isConnected && <button type="button" className="marketplace-connect" disabled={!connectors[0]} onClick={prepareWallet}>Connect wallet</button>}
        </div>
        <div className="marketplace-proof-card">
          <div className="marketplace-proof-label"><ShieldCheck size={17} /> Active resale value</div>
          <strong>{formatEth(totalListingValue)}</strong>
          <span>{activeListings.length} live on-chain listings. Funds go to sellers when purchased; they are not held in escrow.</span>
        </div>
        <div className="marketplace-network-card">
          <span className="marketplace-live-dot" />
          <div><strong>Ethereum Sepolia</strong><span>Test network · ETH here is not mainnet money or fiat.</span></div>
          <b>11155111</b>
        </div>
      </div>

      <div className="marketplace-demo-bar">
        <div className="marketplace-demo-copy"><span className="marketplace-demo-badge">MOCK MODE</span><div><strong>Try the ticket flow without paying</strong><span>Demo tickets stay in this browser. No ETH or fiat is transferred.</span></div></div>
        <label>Demo user<select value={demoProfile} onChange={(event) => { const profile = event.target.value as DemoProfile; setDemoProfile(profile); window.localStorage.setItem("ut3_demo_profile", profile); setDemoNotice(""); }}><option value="user-a">User A</option><option value="user-b">User B</option></select></label>
      </div>

      <div className="marketplace-tabs" role="tablist" aria-label="Marketplace views">
        <button type="button" role="tab" aria-selected={tab === "primary"} className={tab === "primary" ? "active" : ""} onClick={() => setTab("primary")}>Primary tickets</button>
        <button type="button" role="tab" aria-selected={tab === "resale"} className={tab === "resale" ? "active" : ""} onClick={() => setTab("resale")}>Resale listings <span>{activeListings.length + mockListings.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === "owned"} className={tab === "owned" ? "active" : ""} onClick={() => setTab("owned")}>My tickets <span>{ownedTickets.length + mockOwnedTickets.length}</span></button>
      </div>

      {demoNotice && <p role="status" className="marketplace-demo-notice">{demoNotice}</p>}

      {tab === "primary" && (
        <section className="marketplace-tab-panel">
          <div className="marketplace-panel-heading">
            <div><h2>Primary ticket sales</h2><p>Prices, supply, payments, and NFT ownership are read or settled on Sepolia.</p></div>
            <label className="marketplace-quantity">Quantity <input type="number" min="1" max="10" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
          </div>

          {isContractOwner && (
            <div className="marketplace-admin">
              <div><strong>Configure a primary sale</strong><span>Owner only · configuration is written on-chain.</span></div>
              <div className="marketplace-admin-grid">
                <label>Event<select value={eventId} onChange={(event) => { setEventId(event.target.value); setTicketTypeId(""); }}>
                  {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
                </select></label>
                <label>Ticket type<select value={ticketTypeId} onChange={(event) => setTicketTypeId(event.target.value)}>
                  {activeTickets(eventId).map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.name}</option>)}
                </select></label>
                <label>Price per ticket (ETH)<input inputMode="decimal" placeholder="0.01" value={primaryPrice} onChange={(event) => setPrimaryPrice(event.target.value)} /></label>
                <label>Total supply<input type="number" min="1" step="1" placeholder="100" value={primarySupply} onChange={(event) => setPrimarySupply(event.target.value)} /></label>
                <button type="button" className="marketplace-buy" onClick={configureSale} disabled={isPending || isConfirming || events.length === 0}>Set sale on-chain</button>
              </div>
            </div>
          )}

          {eventsLoading ? <div className="marketplace-empty">Loading published events…</div> : eventsError ? <div className="marketplace-empty marketplace-error">Events could not be loaded: {eventsError}</div> : events.length === 0 ? <div className="marketplace-empty">No published events are available for primary sales.</div> : null}
          {hasPrimaryReadFailure && <div className="marketplace-empty marketplace-error">This contract deployment does not expose primary sales yet. Redeploy the updated UTicket3 contract to Sepolia, then set its address in NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS.</div>}
          {!eventsLoading && !eventsError && events.length > 0 && !primaryRead.isLoading && primaryDeals.length === 0 && !hasPrimaryReadFailure && <div className="marketplace-empty">No primary sales are configured on this contract yet.</div>}

          <div className="marketplace-listings">
            {primaryDeals.map((deal) => {
              const remaining = deal.supply - deal.sold;
              return (
                <article className="marketplace-listing primary-deal" key={`${deal.event.id}-${deal.ticket.id}`}>
                  {deal.event.image_url && <img src={deal.event.image_url} alt="" />}
                  <div className="marketplace-listing-info">
                    <span className="marketplace-verified"><ShieldCheck size={14} /> PRIMARY SALE · ON-CHAIN</span>
                    <h3>{deal.event.title}</h3>
                    <span>{deal.ticket.name} · {deal.event.venue}</span>
                    <small>{remaining.toString()} tickets left · {new Date(deal.event.starts_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</small>
                  </div>
                  <div className="marketplace-price"><span>Per ticket</span><strong>{formatEth(deal.priceWei)}</strong><span>Total: {formatEth(deal.priceWei * BigInt(Math.max(1, Number(quantity) || 1)))}</span></div>
                  <button type="button" className="marketplace-buy" onClick={() => buyPrimary(deal)} disabled={isPending || isConfirming || Number(quantity) > Number(remaining)}>
                    {!isConnected ? "Connect wallet" : !isSepolia ? "Switch to Sepolia" : isPending ? "Confirm in wallet…" : isConfirming ? "Confirming…" : "Buy with ETH"}
                  </button>
                </article>
              );
            })}
          </div>

          <div className="marketplace-demo-store">
            <div className="marketplace-panel-heading"><div><h2>Mock ticket store</h2><p>Choose a published event to create a demo ticket for {demoProfile === "user-a" ? "User A" : "User B"}.</p></div><span className="marketplace-demo-badge">NO PAYMENT</span></div>
            {eventsLoading ? <div className="marketplace-empty">Loading demo events…</div> : eventsError ? <div className="marketplace-empty marketplace-error">Demo events could not be loaded: {eventsError}</div> : ticketOptions.length === 0 ? <div className="marketplace-empty">No published ticket types are available for the mock store.</div> : (
              <div className="marketplace-listings">
                {ticketOptions.map(({ event, ticket }) => (
                  <article className="marketplace-listing primary-deal" key={`mock-${event.id}-${ticket.id}`}>
                    {event.image_url && <img src={event.image_url} alt="" />}
                    <div className="marketplace-listing-info"><span className="marketplace-demo-label"><TicketIcon size={14} /> MOCK TICKET</span><h3>{event.title}</h3><span>{ticket.name} · {event.venue}</span><small>{new Date(event.starts_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</small></div>
                    <div className="marketplace-price"><span>Demo price · per ticket</span><strong>{formatPriceFromCents(ticket.price_cents, "en")}</strong><span>Total: {formatPriceFromCents(ticket.price_cents * Math.max(1, Number(quantity) || 1), "en")}</span></div>
                    <button type="button" className="marketplace-buy" onClick={() => buyMockTicket(event, ticket)} disabled={eventsLoading}>Buy demo ticket</button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "resale" && (
        <section className="marketplace-tab-panel">
          <div className="marketplace-panel-heading"><div><h2>Resale listings</h2><p>Buy on-chain NFTs with Sepolia ETH or transfer a local demo ticket between demo users.</p></div></div>
          {(tokenCountLoading || ticketRead.isLoading) && <div className="marketplace-empty">Reading on-chain listings…</div>}
          {(tokenCountError || ticketRead.isError) && <div className="marketplace-empty marketplace-error">Could not read on-chain listings. Demo listings remain available.</div>}
          {!tokenCountLoading && !ticketRead.isLoading && !tokenCountError && !ticketRead.isError && activeListings.length === 0 && mockListings.length === 0 && <div className="marketplace-empty">No resale listings yet. Buy a mock ticket, list it under My tickets, then switch demo user to try buying it.</div>}
          <div className="marketplace-listings">
            {activeListings.map((listing) => {
              const event = events.find((item) => item.id === listing.eventId);
              const ticket = event?.ticket_types.find((item) => item.id === listing.ticketTypeId);
              return (
                <article className="marketplace-listing" key={`chain-${listing.tokenId}`}>
                  <div className="marketplace-ticket-mark"><span>UT3</span><b>#{listing.tokenId.toString().padStart(4, "0")}</b></div>
                  <div className="marketplace-listing-info"><span className="marketplace-verified"><ShieldCheck size={14} /> VERIFIED ON-CHAIN</span><h3>{event?.title || `Ticket NFT #${listing.tokenId}`}</h3><span>{ticket?.name || `Event ${listing.eventId} · Type ${listing.ticketTypeId}`}</span><small>Seller {listing.seller.slice(0, 8)}…{listing.seller.slice(-6)}</small></div>
                  <div className="marketplace-price"><span>Exact on-chain price</span><strong>{formatEth(listing.priceWei)}</strong><a href={`https://sepolia.etherscan.io/token/${ticketContractAddress}?a=${listing.tokenId}`} target="_blank" rel="noreferrer">Verify token <ExternalLink size={13} /></a></div>
                  <button type="button" className="marketplace-buy" onClick={() => buyResale(listing)} disabled={isPending || isConfirming || (address && listing.seller.toLowerCase() === address.toLowerCase())}>{!isConnected ? "Connect wallet" : !isSepolia ? "Switch to Sepolia" : isPending && buyingToken === listing.tokenId ? "Confirm in wallet…" : isConfirming && buyingToken === listing.tokenId ? "Confirming…" : "Buy resale ticket"}</button>
                </article>
              );
            })}
            {mockListings.map((ticket) => {
              const event = ticket.ticket_types?.events;
              const isOwnListing = ticket.demo_profile === demoProfile;
              return (
                <article className="marketplace-listing primary-deal" key={`mock-listing-${ticket.id}`}>
                  {event?.image_url && <img src={event.image_url} alt="" />}
                  <div className="marketplace-listing-info"><span className="marketplace-demo-label"><Tag size={14} /> MOCK RESALE</span><h3>{event?.title || `Demo ticket ${ticket.ticket_code}`}</h3><span>{ticket.ticket_types?.name || "General admission"} · Seller {ticket.demo_profile === "user-a" ? "User A" : "User B"}</span><small>Browser demo only · no payment processed</small></div>
                  <div className="marketplace-price"><span>Demo resale price</span><strong>{formatPriceFromCents(ticket.demo_resale_price_cents || 0, "en")}</strong></div>
                  <button type="button" className="marketplace-buy" onClick={() => buyMockListing(ticket)} disabled={isOwnListing}>{isOwnListing ? "Your listing" : "Buy demo resale"}</button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tab === "owned" && (
        <section className="marketplace-tab-panel">
          <div className="marketplace-panel-heading"><div><h2>My tickets · {demoProfile === "user-a" ? "User A" : "User B"}</h2><p>Mock tickets persist in this browser. Sepolia NFTs appear below when a wallet is connected.</p></div></div>
          <section className="marketplace-mock-owned">
            <h3><TicketIcon size={17} /> Mock tickets <span>{mockOwnedTickets.length}</span></h3>
            {mockOwnedTickets.length === 0 ? <div className="marketplace-empty">No mock tickets for this user. Buy one from the Primary tickets tab to get started.</div> : (
              <div className="marketplace-listings">
                {mockOwnedTickets.map((ticket) => {
                  const event = ticket.ticket_types?.events;
                  const original = ticket.demo_purchase_price_cents || ticket.ticket_types?.price_cents || 0;
                  const isListed = (ticket.demo_resale_price_cents || 0) > 0;
                  const maxPrice = Math.floor(original * 1.1);
                  return (
                    <article className="marketplace-listing primary-deal" key={`owned-mock-${ticket.id}`}>
                      {event?.image_url && <img src={event.image_url} alt="" />}
                      <div className="marketplace-listing-info"><span className="marketplace-demo-label"><TicketIcon size={14} /> DEMO TICKET · {ticket.status}</span><h3>{event?.title || ticket.ticket_code}</h3><span>{ticket.ticket_types?.name || "General admission"} · Code {ticket.ticket_code}</span><small>Mock purchase {formatPriceFromCents(original, "en")} · Resale cap {formatPriceFromCents(maxPrice, "en")}</small></div>
                      <div className="marketplace-owned-actions">
                        {isListed ? <><strong>Listed for {formatPriceFromCents(ticket.demo_resale_price_cents || 0, "en")}</strong><button type="button" className="outline-button" onClick={() => cancelMockListing(ticket.id)}>Cancel mock listing</button></> : <><label>Resale price (USD)<input inputMode="decimal" value={demoResalePrices[ticket.id] ?? (maxPrice / 100).toFixed(2)} onChange={(event) => setDemoResalePrices((prices) => ({ ...prices, [ticket.id]: event.target.value }))} /></label><button type="button" className="marketplace-buy" onClick={() => listMockTicket(ticket)}>List mock ticket</button></>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="marketplace-chain-owned">
            <h3><Wallet size={17} /> On-chain tickets</h3>
            {!isConnected ? <div className="marketplace-empty"><span>Connect your wallet to check and list Sepolia NFTs.</span><button type="button" className="marketplace-buy" onClick={prepareWallet}>Connect wallet</button></div> : tokenCountLoading || ticketRead.isLoading ? <div className="marketplace-empty">Checking wallet ownership…</div> : ownedTickets.length === 0 ? <div className="marketplace-empty">No on-chain tickets found for {address?.slice(0, 8)}…{address?.slice(-6)}.</div> : (
            <div className="marketplace-listings">
              {ownedTickets.map((ticket) => {
                const event = events.find((item) => item.id === ticket.eventId);
                const ticketType = event?.ticket_types.find((item) => item.id === ticket.ticketTypeId);
                const isListed = Boolean(address && ticket.seller.toLowerCase() === address.toLowerCase() && ticket.priceWei > BigInt(0));
                const maxPrice = ticket.originalPriceWei + (ticket.originalPriceWei * BigInt(1000)) / BigInt(10000);
                return (
                  <article className="marketplace-listing owned-listing" key={ticket.tokenId}>
                    <div className="marketplace-ticket-mark"><span>UT3</span><b>#{ticket.tokenId.toString().padStart(4, "0")}</b></div>
                    <div className="marketplace-listing-info"><span className="marketplace-verified"><ShieldCheck size={14} /> WALLET VERIFIED</span><h3>{event?.title || `Ticket NFT #${ticket.tokenId}`}</h3><span>{ticketType?.name || `Event ${ticket.eventId} · Type ${ticket.ticketTypeId}`}</span><small>Original price {formatEth(ticket.originalPriceWei)} · Resale cap {formatEth(maxPrice)}</small></div>
                    <div className="marketplace-owned-actions">
                      {isListed ? <><strong>Listed for {formatEth(ticket.priceWei)}</strong><button type="button" className="outline-button" onClick={() => cancelListing(ticket.tokenId)} disabled={isPending || isConfirming}>Cancel listing</button></> : <><label>Resale price (ETH)<input inputMode="decimal" value={resalePrices[ticket.tokenId] ?? formatEther(ticket.originalPriceWei)} onChange={(event) => setResalePrices((prices) => ({ ...prices, [ticket.tokenId]: event.target.value }))} /></label><button type="button" className="marketplace-buy" onClick={() => listTicket(ticket)} disabled={!isSepolia || isPending || isConfirming || ticket.checkedIn}>List ticket</button></>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          </section>
        </section>
      )}

      {actionError && <p role="alert" className="marketplace-transaction marketplace-error">{actionError}</p>}
      {txError && <p role="alert" className="marketplace-transaction marketplace-error">{txError.message}</p>}
      {txConfirmed && txHash && <p role="status" className="marketplace-transaction">Transaction confirmed: <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">View on Etherscan <ExternalLink size={13} /></a></p>}
      {tokenCount > scanLimit && <p className="marketplace-footnote">Scanning the latest {scanLimit} of {tokenCount} minted tickets.</p>}
    </section>
  );
}