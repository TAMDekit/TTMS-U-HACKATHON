"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  Lock,
  MapPin,
  Menu,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Tag,
  Ticket as TicketIcon,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { parseEther } from "viem";
import { QRCodeSVG } from "qrcode.react";
import { ticketContractAbi, ticketContractAddress } from "../lib/ticket-contract";
import { getPublishedEvents, type LiveEvent, type TicketType } from "../lib/events";
import { reserveTickets, type Reservation } from "../lib/reservations";
import { completePurchase, getMyTickets, linkTicketNft, checkInTicket, type Ticket } from "../lib/orders";

const fallbackEvents: LiveEvent[] = [
  {
    id: 99,
    title: "My Chemical Romance – Asia Tour",
    slug: "my-chemical-romance-asia-tour",
    artist: "My Chemical Romance",
    category: "Concert",
    venue: "Impact Challenger Hall 1, Bangkok",
    starts_at: "2026-11-17T20:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
    description: "Official Asia Tour 2026. Live at Impact Challenger Hall 1, Muang Thong Thani, Nonthaburi. Experience iconic anthems on-stage with verified ERC-721 smart contract tickets.",
    ticket_types: [
      { id: 991, event_id: 99, name: "Regular – Standing Zone A", price_cents: 350000, total_supply: 2000, available_supply: 12 },
      { id: 992, event_id: 99, name: "Seats (Reserved Tier 1)", price_cents: 420000, total_supply: 800, available_supply: 0 },
      { id: 993, event_id: 99, name: "VIP Lounge & Exclusive Soundcheck", price_cents: 750000, total_supply: 300, available_supply: 0 },
    ],
  },
  {
    id: 1,
    title: "BLACKPINK WORLD TOUR <BORN PINK> FINALE",
    slug: "blackpink-born-pink-finale",
    artist: "BLACKPINK",
    category: "Concert",
    venue: "Rajamangala National Stadium, Bangkok",
    starts_at: "2026-11-20T19:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1000&q=80",
    description: "The record-breaking global tour concludes with an unforgettable stadium spectacle in Bangkok.",
    ticket_types: [
      { id: 101, event_id: 1, name: "VIP Standing (Soundcheck)", price_cents: 14800, total_supply: 400, available_supply: 380 },
      { id: 102, event_id: 1, name: "Standing Zone A", price_cents: 9800, total_supply: 1200, available_supply: 1150 },
      { id: 103, event_id: 1, name: "Seated Tier 1", price_cents: 6800, total_supply: 1500, available_supply: 1420 },
    ],
  },
  {
    id: 2,
    title: "Coldplay: Music of the Spheres Tour",
    slug: "coldplay-music-of-the-spheres",
    artist: "Coldplay",
    category: "Concert",
    venue: "National Stadium, Bangkok",
    starts_at: "2026-11-25T20:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1000&q=80",
    description: "A luminous celebration of music, sustainability, and joy with kinetic energy dancefloors and cosmic stages.",
    ticket_types: [
      { id: 201, event_id: 2, name: "Kubik Experience (VIP)", price_cents: 12500, total_supply: 300, available_supply: 290 },
      { id: 202, event_id: 2, name: "General Standing", price_cents: 5800, total_supply: 2000, available_supply: 1920 },
      { id: 203, event_id: 2, name: "Upper Bleachers", price_cents: 3500, total_supply: 1800, available_supply: 1750 },
    ],
  },
  {
    id: 3,
    title: "IU H.E.R. WORLD TOUR CONCERT IN BANGKOK",
    slug: "iu-her-world-tour-bangkok",
    artist: "IU (Lee Ji-eun)",
    category: "Concert",
    venue: "Impact Arena, Muang Thong Thani",
    starts_at: "2026-12-05T18:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80",
    description: "South Korea sovereign vocal icon IU returns with a magical 3-hour emotional live journey and encore stages.",
    ticket_types: [
      { id: 301, event_id: 3, name: "VIP Platinum (Lanyard + Soundcheck)", price_cents: 11000, total_supply: 350, available_supply: 340 },
      { id: 302, event_id: 3, name: "Gold Seated", price_cents: 6500, total_supply: 1000, available_supply: 960 },
      { id: 303, event_id: 3, name: "Silver Seated", price_cents: 3800, total_supply: 1200, available_supply: 1180 },
    ],
  },
  {
    id: 4,
    title: "Tattoo Colour: กาลครั้ง 5 แทททู คัลเลอร์",
    slug: "tattoo-colour-carnival-5",
    artist: "Tattoo Colour",
    category: "Concert",
    venue: "BITEC Bangna Hall 100, Bangkok",
    starts_at: "2026-12-13T19:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80",
    description: "คอนเสิร์ตใหญ่จัดเต็มของวงป๊อปอันดับหนึ่งแห่งยุค พร้อมแขกรับเชิญสุดเซอร์ไพรส์และเพลงฮิตตลอด 15 ปี",
    ticket_types: [
      { id: 401, event_id: 4, name: "บัตรยืนสุดชิล (Early Bird)", price_cents: 2500, total_supply: 800, available_supply: 750 },
      { id: 402, event_id: 4, name: "บัตรนั่ง VIP มีเก้าอี้", price_cents: 4000, total_supply: 400, available_supply: 390 },
    ],
  },
  {
    id: 5,
    title: "Big Mountain Music Festival 15 (BMMF15)",
    slug: "bmmf-15-khao-yai",
    artist: "Various Artists",
    category: "Festival",
    venue: "The Ocean Khao Yai, Nakhon Ratchasima",
    starts_at: "2026-12-12T14:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1000&q=80",
    description: "เทศกาลดนตรีที่ใหญ่ที่สุดในประเทศไทย 9 เวที 200 กว่าศิลปิน ท่ามกลางลมหนาวและแคมป์ปิ้งเขาใหญ่",
    ticket_types: [
      { id: 501, event_id: 5, name: "2-Day Early Cow Pass", price_cents: 3200, total_supply: 5000, available_supply: 4850 },
      { id: 502, event_id: 5, name: "VIP 2-Day Pass (Fast Lane + Lounge)", price_cents: 6500, total_supply: 800, available_supply: 760 },
    ],
  },
  {
    id: 6,
    title: "Wonderfruit 2026: Art & Life Festival",
    slug: "wonderfruit-2026-pattaya",
    artist: "Global Artists",
    category: "Festival",
    venue: "The Fields at Siam Country Club, Pattaya",
    starts_at: "2026-12-17T12:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&w=1000&q=80",
    description: "A global gathering celebrating art, sustainable architecture, wellness and world music across 5 days.",
    ticket_types: [
      { id: 601, event_id: 6, name: "Full 5-Day Wonder Pass", price_cents: 8900, total_supply: 1200, available_supply: 1150 },
      { id: 602, event_id: 6, name: "Weekend Pass (Fri-Sun)", price_cents: 6200, total_supply: 800, available_supply: 780 },
    ],
  },
  {
    id: 7,
    title: "Summer Sonic Bangkok 2026",
    slug: "summer-sonic-bangkok-2026",
    artist: "International Headliners",
    category: "Festival",
    venue: "IMPACT Challenger Hall, Bangkok",
    starts_at: "2027-01-23T13:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1000&q=80",
    description: "The premier Japanese urban music festival brings rock, pop, and electronic legends to Bangkok.",
    ticket_types: [
      { id: 701, event_id: 7, name: "1-Day General Entry", price_cents: 4500, total_supply: 2500, available_supply: 2400 },
      { id: 702, event_id: 7, name: "2-Day Combo Ticket", price_cents: 7900, total_supply: 1500, available_supply: 1420 },
    ],
  },
  {
    id: 8,
    title: "Park Bo-gum Asia Fan Meeting: Good Day",
    slug: "park-bo-gum-fan-meeting-bangkok",
    artist: "Park Bo-gum",
    category: "Fan Meeting",
    venue: "Thunder Dome, Muang Thong Thani",
    starts_at: "2027-01-17T18:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=80",
    description: "An intimate fan meeting with warm singing, candid talks and memorable interactive hi-touch benefits.",
    ticket_types: [
      { id: 801, event_id: 8, name: "Hi-Touch VIP Seated", price_cents: 6800, total_supply: 300, available_supply: 280 },
      { id: 802, event_id: 8, name: "Standard Seated", price_cents: 3800, total_supply: 800, available_supply: 770 },
    ],
  },
  {
    id: 9,
    title: "Billkin & PP Krit: Double Trouble Fan Fest",
    slug: "billkin-pp-krit-double-trouble",
    artist: "Billkin & PP Krit",
    category: "Fan Meeting",
    venue: "Queen Sirikit National Convention Center (QSNCC)",
    starts_at: "2027-02-07T17:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=80",
    description: "แฟนมีตติ้งและคอนเสิร์ตคู่สุดพิเศษของบิวกิ้นและพีพี พร้อมโชว์เดี่ยวและสเตจร่วมสุดอลังการ",
    ticket_types: [
      { id: 901, event_id: 9, name: "VIP Stage Front + Official Poster", price_cents: 7500, total_supply: 450, available_supply: 420 },
      { id: 902, event_id: 9, name: "Regular Seated", price_cents: 4200, total_supply: 1200, available_supply: 1150 },
    ],
  },
  {
    id: 10,
    title: "The Phantom of the Opera Bangkok",
    slug: "phantom-of-the-opera-bangkok",
    artist: "West End Cast & Orchestra",
    category: "Stage & Musical",
    venue: "Muangthai Rachadalai Theatre, Bangkok",
    starts_at: "2027-01-30T19:30:00+07:00",
    image_url: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1000&q=80",
    description: "The world most acclaimed musical returns with grand orchestral accompaniment, chandelier and gothic splendour.",
    ticket_types: [
      { id: 1001, event_id: 10, name: "Royal Circle (Best View)", price_cents: 5500, total_supply: 300, available_supply: 290 },
      { id: 1002, event_id: 10, name: "Stalls / Balcony", price_cents: 2800, total_supply: 600, available_supply: 580 },
    ],
  },
  {
    id: 11,
    title: "ฟ้าจรดทราย เดอะมิวสิคัล 2026",
    slug: "fah-jarod-sai-the-musical",
    artist: "Rachadalai All-Stars Cast",
    category: "Stage & Musical",
    venue: "Muangthai Rachadalai Theatre, Bangkok",
    starts_at: "2027-02-14T19:00:00+07:00",
    image_url: "https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=1000&q=80",
    description: "ละครเวทีฟอร์มยักษ์ระดับตำนาน บทเพลงไพเราะและการแสดงสุดตราตรึงใจ",
    ticket_types: [
      { id: 1101, event_id: 11, name: "บัตรทองคำ ชั้น 1", price_cents: 4500, total_supply: 350, available_supply: 330 },
      { id: 1102, event_id: 11, name: "บัตรชั้น 2 บรรยากาศอบอุ่น", price_cents: 2200, total_supply: 500, available_supply: 480 },
    ],
  },
  {
    id: 12,
    title: "Riverside Jazz & Acoustic Sessions",
    slug: "riverside-jazz-sessions",
    artist: "The Bangkok Quintet",
    category: "Live & Acoustic",
    venue: "River City Bangkok",
    starts_at: "2027-02-21T18:30:00+07:00",
    image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80",
    description: "A relaxed acoustic sunset performance beside the Chao Phraya River with limited intimate seating.",
    ticket_types: [
      { id: 1201, event_id: 12, name: "Riverside Seat", price_cents: 2800, total_supply: 150, available_supply: 140 },
      { id: 1202, event_id: 12, name: "Cocktail Lounge", price_cents: 4500, total_supply: 50, available_supply: 45 },
    ],
  },
];

export default function Home() {
  const [lang, setLang] = useState<"en" | "th">("en");
  const [view, setView] = useState("home");
  const [eventsList, setEventsList] = useState<LiveEvent[]>(fallbackEvents);
  const [selected, setSelected] = useState<LiveEvent>(fallbackEvents[0]);
  const [search, setSearch] = useState("");
  const [slide, setSlide] = useState(0);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [wallet, setWallet] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [lastOrder, setLastOrder] = useState<{ order_id: string; total_cents: number; quantity: number; ticket_ids: string[]; ticket_type_name: string } | null>(null);

  const loadEvents = async () => {
    try {
      const data = await getPublishedEvents();
      if (data && data.length > 0) {
        // Merge Supabase events with rich events catalog so custom added events are prominently shown
        const seenSlugs = new Set(data.map((e) => e.slug));
        const combined = [...data, ...fallbackEvents.filter((f) => !seenSlugs.has(f.slug))];
        setEventsList(combined);
        setSelected(combined[0]);
        return;
      }
    } catch (e) {
      console.warn("Supabase event load fallback:", e);
    }
    setEventsList(fallbackEvents);
    setSelected(fallbackEvents[0]);
  };

  useEffect(() => {
    loadEvents();
    const supabase = createSupabaseBrowserClient();
    let active = true;

    const extractUserName = (user: { user_metadata?: { full_name?: string; name?: string }; email?: string } | null | undefined) => {
      if (!user) return "";
      return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";
    };

    // Handle OAuth callback if ?code= is present in URL
    if (typeof window !== "undefined" && window.location.search.includes("code=")) {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
          if (!error && data.session && active) {
            setAuthed(true);
            setUserName(extractUserName(data.session.user));
            setAuthReady(true);
            // Clean URL query param without refreshing
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        }).catch((err) => {
          console.warn("exchangeCodeForSession notice:", err);
        });
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setAuthed(Boolean(data.session));
        if (data.session?.user) {
          setUserName(extractUserName(data.session.user));
        }
        setAuthReady(true);
      }
    }).catch(() => {
      if (active) setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session));
      setUserName(extractUserName(session?.user));
      setAuthReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const filtered = eventsList.filter((e) =>
    (e.title + (e.artist || "") + e.venue).toLowerCase().includes(search.toLowerCase())
  );

  const open = (e: LiveEvent) => {
    setSelected(e);
    setSelectedTicketIndex(0);
    setQty(1);
    setCurrentReservation(null);
    setView("detail");
  };

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const logout = async () => {
    try {
      disconnect();
    } catch (e) {
      console.warn("Wallet disconnect on logout:", e);
    }
    await createSupabaseBrowserClient().auth.signOut();
    setAuthed(false);
    setUserName("");
    setView("home");
  };

  const activeTicketTypes = selected.ticket_types && selected.ticket_types.length > 0
    ? selected.ticket_types
    : [{ id: 1, event_id: selected.id, name: "General Admission", price_cents: 4200, total_supply: 100, available_supply: 100 }];

  const currentTicketType = activeTicketTypes[selectedTicketIndex] || activeTicketTypes[0];

  return (
    <>
      <header className="topbar">
        <div className="nav-wrap">
          <button className="mobile-menu" aria-label="Menu"><Menu size={21} /></button>
          <button className="logo" onClick={() => setView("home")}>
            <span>✦</span> U Ticket 3
          </button>
          <div className="header-search">
            <Search size={18} />
            <input placeholder={lang === "th" ? "ค้นหาอีเวนต์ ศิลปิน สถานที่" : "Search events, artists, venues"} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <nav className="main-nav">
            <button onClick={() => setView("home")}>{lang === "th" ? "อีเวนต์" : "Events"}</button>
            {authed && (
              <>
                <button onClick={() => setView("tickets")}>
                  <TicketIcon size={14} /> {lang === "th" ? "ตั๋วของฉัน & ตลาดขายต่อ" : "My Tickets & Resale"}
                </button>
                <button onClick={() => setView("organizer")}>{lang === "th" ? "ผู้จัดงาน" : "Organizer"}</button>
              </>
            )}

            {/* Language Switcher Button */}
            <button
              className="lang-toggle-btn"
              onClick={() => setLang(lang === "en" ? "th" : "en")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 10px",
                borderRadius: "20px",
                border: "1px solid var(--line)",
                background: "#f9fafb",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--purple)",
              }}
              title="Switch language / เปลี่ยนภาษา"
            >
              <Globe size={14} />
              {lang === "en" ? "TH / ฿" : "EN / $"}
            </button>

            <button className="wallet-link" onClick={() => setWallet(true)}>
              <Wallet size={15} /> {isConnected && address ? `${address.slice(0, 6)}…${address.slice(-4)}` : lang === "th" ? "เชื่อมต่อกระเป๋า" : "Connect wallet"}
            </button>
            <button className="login" onClick={() => (authed ? logout() : setView("auth"))}>
              {!authReady ? "Checking…" : authed ? `${userName ? userName : "User"} · ${lang === "th" ? "ออกจากระบบ" : "Log out"}` : lang === "th" ? "เข้าสู่ระบบ / ลงทะเบียน" : "Log In / Sign Up"}
            </button>
          </nav>
          {authed && (
            <button className="mobile-ticket" onClick={() => setView("tickets")} aria-label="Tickets">
              <TicketIcon size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="page-wrap">
        {view === "home" && (
          <HomeView slide={slide} setSlide={setSlide} open={open} events={filtered} />
        )}
        {view === "auth" && (
          <Auth onDone={() => { setAuthed(true); setView("home"); }} />
        )}
        {view === "detail" && (
          <Detail
            event={selected}
            ticketTypes={activeTicketTypes}
            ticketIndex={selectedTicketIndex}
            setTicketIndex={setSelectedTicketIndex}
            qty={qty}
            setQty={setQty}
            back={() => setView("home")}
            onReserved={(reservation) => {
              setCurrentReservation(reservation);
              setView("cart");
            }}
            authed={authed}
            onRequireAuth={() => setView("auth")}
            lang={lang}
          />
        )}
        {view === "cart" && (
          <Cart
            event={selected}
            ticketType={currentTicketType}
            qty={qty}
            reservation={currentReservation}
            back={() => setView("detail")}
            checkout={() => setView("checkout")}
          />
        )}
        {view === "checkout" && (
          <Checkout
            event={selected}
            ticketType={currentTicketType}
            qty={qty}
            reservation={currentReservation}
            back={() => setView("cart")}
            onSuccess={(orderData) => {
              setLastOrder(orderData);
              setView("success");
            }}
          />
        )}
        {view === "success" && (
          <Success order={lastOrder} event={selected} onViewTickets={() => setView(authed ? "tickets" : "auth")} />
        )}
        {view === "tickets" && (
          authed ? <MyTickets event={selected} /> : <Auth onDone={() => { setAuthed(true); setView("tickets"); }} />
        )}
        {view === "organizer" && (
          authed ? <Organizer events={eventsList} /> : <Auth onDone={() => { setAuthed(true); setView("organizer"); }} />
        )}
      </main>

      <footer>
        <div className="footer-inner">
          <div>
            <div className="logo"><span>✦</span> U Ticket 3</div>
            <p>Direct Web3 ticketing with fair resale caps on Ethereum Sepolia.</p>
          </div>
          <div>
            <strong>Marketplace</strong>
            <a onClick={() => setView("home")}>All Events</a>
            {authed && (
              <>
                <a onClick={() => setView("tickets")}>Resale Market</a>
                <a onClick={() => setView("tickets")}>My Collection</a>
              </>
            )}
          </div>
          {authed && (
            <div>
              <strong>Organizer Portal</strong>
              <a onClick={() => setView("organizer")}>Check-in Scanner</a>
              <a onClick={() => setView("organizer")}>Sales & Inventory</a>
              <a>Verified Creator Guide</a>
            </div>
          )}
          <div>
            <strong>Smart Contract</strong>
            <a href={`https://sepolia.etherscan.io/address/${ticketContractAddress}`} target="_blank" rel="noreferrer">
              Etherscan Contract ↗
            </a>
            <a>Chain ID: 11155111</a>
            <a>ERC-721 Standard</a>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 U Ticket 3 <span>Built on Ethereum Sepolia · Verified Fair Resale</span>
        </div>
      </footer>

      {wallet && <WalletModal close={() => setWallet(false)} />}
    </>
  );
}

function HomeView({
  slide,
  setSlide,
  open,
  events,
}: {
  slide: number;
  setSlide: (n: number) => void;
  open: (e: LiveEvent) => void;
  events: LiveEvent[];
}) {
  const banners = [
    {
      title: "Fair ticketing. Permanent ownership.",
      sub: "Official concert tickets with on-chain verification and a strict 10% resale cap.",
      image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1800&q=85",
    },
    {
      title: "Collect your live memories on-chain",
      sub: "Never worry about counterfeit tickets again. Verified on Ethereum Sepolia.",
      image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1800&q=85",
    },
  ];
  const b = banners[slide];

  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Concert", "Festival", "Fan Meeting", "Stage & Musical", "Live & Acoustic"];

  const displayedEvents = activeCategory === "All"
    ? events
    : events.filter((e) => (e.category || "Concert") === activeCategory);

  return (
    <>
      <section
        className="hero-banner"
        style={{ backgroundImage: `linear-gradient(90deg,rgba(23,6,55,.82),rgba(45,8,127,.2)),url(${b.image})` }}
      >
        <div className="hero-content">
          <span className="eyebrow">U TICKET 3 PRESENTS</span>
          <h1>{b.title}</h1>
          <p>{b.sub}</p>
          <button
            className="white-button"
            onClick={() => document.getElementById("events-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            Explore events <ArrowRight size={17} />
          </button>
        </div>
        <button className="slide prev" onClick={() => setSlide((slide + 1) % 2)} aria-label="Previous">
          <ChevronLeft />
        </button>
        <button className="slide next" onClick={() => setSlide((slide + 1) % 2)} aria-label="Next">
          <ChevronRight />
        </button>
        <div className="dots">
          {banners.map((_, i) => (
            <i key={i} className={i === slide ? "selected" : ""} onClick={() => setSlide(i)} />
          ))}
        </div>
      </section>

      <section className="categories" id="events-section">
        <div className="section-head">
          <div>
            <span className="eyebrow purple">EXPLORE EXPERIENCES</span>
            <h2>Upcoming Events</h2>
          </div>
          <span className="view-all">{displayedEvents.length} Events</span>
        </div>

        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={activeCategory === cat ? "active" : ""}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "All" ? "All Events" : cat}
            </button>
          ))}
        </div>

        <div className="event-grid">
          {displayedEvents.map((e) => (
            <Card key={e.id} event={e} open={open} />
          ))}
        </div>
      </section>
    </>
  );
}

function Card({ event, open }: { event: LiveEvent; open: (e: LiveEvent) => void }) {
  const dateFormatted = new Date(event.starts_at).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const minPrice = event.ticket_types && event.ticket_types.length > 0
    ? Math.min(...event.ticket_types.map((t) => t.price_cents)) / 100
    : 42;

  return (
    <button className="event-card" onClick={() => open(event)}>
      <div className="card-image" style={{ backgroundImage: `url(${event.image_url})` }}>
        <span>{event.category || "Concert"}</span>
      </div>
      <div className="card-content">
        <h3>{event.title}</h3>
        <p>{event.artist || "Featured Artist"}</p>
        <div className="card-meta">
          <span><CalendarDays size={14} />{dateFormatted}</span>
          <span><MapPin size={14} />{event.venue}</span>
        </div>
        <strong>From ${minPrice.toFixed(2)}</strong>
      </div>
    </button>
  );
}

// Helper for Proof of Work (PoW) anti-bot mining
async function solveProofOfWork(
  challenge: string,
  difficulty = 3,
  onProgress?: (nonce: number, hash: string) => void
): Promise<{ nonce: number; hash: string }> {
  const prefix = "0".repeat(difficulty);
  let nonce = 0;
  const encoder = new TextEncoder();

  while (true) {
    const data = encoder.encode(`${challenge}:${nonce}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    if (nonce % 70 === 0 && onProgress) {
      onProgress(nonce, hashHex);
      await new Promise((r) => setTimeout(r, 8)); // non-blocking yield for UI animation
    }

    if (hashHex.startsWith(prefix)) {
      if (onProgress) onProgress(nonce, hashHex);
      return { nonce, hash: hashHex };
    }
    nonce++;
  }
}

function Detail({
  event,
  ticketTypes,
  ticketIndex,
  setTicketIndex,
  qty,
  setQty,
  back,
  onReserved,
  authed,
  onRequireAuth,
  lang = "en",
}: {
  event: LiveEvent;
  ticketTypes: TicketType[];
  ticketIndex: number;
  setTicketIndex: (n: number) => void;
  qty: number;
  setQty: (n: number) => void;
  back: () => void;
  onReserved: (reservation: Reservation) => void;
  authed: boolean;
  onRequireAuth: () => void;
  lang?: "en" | "th";
}) {
  const [activeTab, setActiveTab] = useState<"primary" | "resale">("primary");
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState("");
  const [alertsOn, setAlertsOn] = useState(true);
  const [userStatus, setUserStatus] = useState<"none" | "interested" | "going">("none");

  // PoW Anti-Bot Queue State
  const [powModalOpen, setPowModalOpen] = useState(false);
  const [powProgress, setPowProgress] = useState(0);
  const [powNonce, setPowNonce] = useState(0);
  const [powHash, setPowHash] = useState("");
  const [powStatusText, setPowStatusText] = useState("");

  // Resale Listing Modal State
  const [showResaleModal, setShowResaleModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

  // Wagmi contracts for on-chain Resale
  const { address, isConnected } = useAccount();
  const { writeContract, data: resaleTxHash, isPending: resaleIsPending, error: resaleError } = useWriteContract();
  const { isLoading: resaleIsConfirming, isSuccess: resaleIsSuccess } = useWaitForTransactionReceipt({ hash: resaleTxHash });

  // On-chain Sell listing inputs
  const [sellTokenId, setSellTokenId] = useState("");
  const [sellPriceEth, setSellPriceEth] = useState("0.038");

  // On-chain active listings data lookup for token IDs #1, #2, #3, #4
  const listingTokens = [1, 2, 3];
  const listingCalls = listingTokens.map((id) => ({
    address: ticketContractAddress,
    abi: ticketContractAbi,
    functionName: "listings" as const,
    args: [BigInt(id)] as const,
  }));

  const listingsData = useReadContracts({
    contracts: listingCalls,
  });

  const selectedType = ticketTypes[ticketIndex] || ticketTypes[0];

  const handleStartPurchaseForTier = (tierIndex: number) => {
    setTicketIndex(tierIndex);
    const tier = ticketTypes[tierIndex] || ticketTypes[0];
    if (tier.available_supply <= 0) {
      alert(lang === "th" ? "บัตรประเภทนี้หมดแล้ว คุณสามารถเลือกซื้อในแท็บ Resale หรือลงชื่อใน Waitlist" : "This ticket tier is currently sold out. You can buy verified resale tickets in the Resale tab or join the waitlist.");
      return;
    }
    if (!authed) {
      onRequireAuth();
      return;
    }
    // Launch Proof of Work challenge modal
    setPowModalOpen(true);
    setPowProgress(10);
    setPowStatusText(lang === "th" ? "กำลังเริ่มระบบคิวจำลองการขุด PoW ป้องกันบอท…" : "Initializing anti-bot queue challenge…");
    const challenge = `uticket3-pow-${event.id}-${tier.id}-${Date.now()}`;

    solveProofOfWork(challenge, 3, (nonce, hash) => {
      setPowNonce(nonce);
      setPowHash(hash);
      setPowProgress((prev) => Math.min(95, prev + 4));
      setPowStatusText(lang === "th" ? `กำลังตรวจสอบ Human PoW Nonce #${nonce}…` : `Verifying Human PoW Nonce #${nonce}…`);
    })
      .then((res) => {
        setPowProgress(100);
        setPowStatusText(lang === "th" ? `ยืนยันสำเร็จ! Golden Nonce: ${res.nonce}` : `PoW Verified! Golden Nonce: ${res.nonce}`);
        setTimeout(() => {
          setPowModalOpen(false);
          executeReservation(tier);
        }, 700);
      })
      .catch((err) => {
        console.error(err);
        setPowModalOpen(false);
        setError(lang === "th" ? "การตรวจสอบความถูกต้องล้มเหลว กรุณาลองใหม่อีกครั้ง" : "Anti-bot verification encountered an error. Please try again.");
      });
  };

  const executeReservation = async (targetTier?: TicketType) => {
    const tier = targetTier || selectedType;
    setReserving(true);
    setError("");
    try {
      const reservation = await reserveTickets(tier.id, qty);
      onReserved(reservation);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to reserve tickets";
      if (msg.includes("SOLD_OUT")) {
        setError(lang === "th" ? "บัตรประเภทนี้ขายหมดแล้ว หรือเกินจำนวนคงเหลือ" : "This tier is currently sold out or exceeds remaining supply.");
      } else if (msg.includes("AUTH_REQUIRED")) {
        onRequireAuth();
      } else {
        console.warn("Using demo reservation fallback for ticketType:", tier.id, msg);
        const mockReservation: Reservation = {
          id: "res-demo-" + Date.now(),
          ticket_type_id: tier.id,
          quantity: qty,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          status: "ACTIVE",
        };
        onReserved(mockReservation);
      }
    } finally {
      setReserving(false);
    }
  };

  const handleBuyResale = (tokenId: number, priceWei: bigint) => {
    if (!isConnected) {
      alert(lang === "th" ? "กรุณาเชื่อมต่อ MetaMask หรือ Web3 Wallet ของคุณก่อนทำการสั่งซื้อ On-Chain" : "Please connect your MetaMask / Web3 wallet to execute on-chain purchase.");
      return;
    }
    writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "buy",
      args: [BigInt(tokenId)],
      value: priceWei,
    });
  };

  const handleListResale = () => {
    if (!isConnected) {
      alert(lang === "th" ? "กรุณาเชื่อมต่อกระเป๋าก่อนทำรายการ" : "Please connect your wallet first.");
      return;
    }
    if (!sellTokenId || !sellPriceEth) return;
    const priceNum = parseFloat(sellPriceEth);
    // Strict 30% cap check (Original ~0.038 ETH -> Max 30% = 0.0494 ETH)
    if (priceNum > 0.0495) {
      alert(lang === "th" ? "ราคาขายต่อเกินเพดานที่กำหนด! ระบบจำกัดเพดานราคาห้ามขายเกิน 30% (สูงสุดไม่เกิน 0.049 ETH) เพื่อป้องกันการเก็งกำไร" : "Price exceeds limit! Resale is strictly capped at +30% max (up to 0.049 ETH) to prevent scalping.");
      return;
    }
    writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "list",
      args: [BigInt(sellTokenId), parseEther(sellPriceEth)],
    });
  };

  const dateFormatted = new Date(event.starts_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeFormatted = new Date(event.starts_at).toLocaleTimeString(lang === "th" ? "th-TH" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate live total available tickets across all tiers
  const totalAvailable = ticketTypes.reduce((acc, t) => acc + (t.available_supply || 0), 0);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "10px 0 60px" }}>
      {/* Breadcrumb Navigation */}
      <div className="ref-breadcrumb">
        <a onClick={back}>{lang === "th" ? "หน้าแรก" : "Home"}</a>
        <ChevronRight size={14} />
        <a>{lang === "th" ? "บัตรคอนเสิร์ต" : "Concert Tickets"}</a>
        <ChevronRight size={14} />
        <span className="current">{event.title}</span>
      </div>

      <div className="ref-detail-grid">
        {/* Left Column: Event Visual & Social actions */}
        <div className="ref-left-col">
          <div className="ref-banner-card">
            <img src={event.image_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80"} alt={event.title} />
            <div className="ref-banner-badge">
              <ShieldCheck size={14} style={{ color: "#4ade80" }} />
              {lang === "th" ? "รับประกันโดย Smart Contract" : "Smart Contract Guaranteed"}
            </div>
          </div>

          <div className="ref-event-title-wrap">
            <div className="ref-verified-pill">
              <span />
              {lang === "th" ? "จำหน่ายตั๋วอย่างเป็นทางการ & ตลาดขายต่อปลอดภัย" : "Official Verified Primary & Resale"}
            </div>
            <h1 className="ref-event-title">{event.title}</h1>
          </div>

          <div className="ref-meta-list">
            <div className="ref-meta-item">
              <div className="ref-meta-icon">
                <CalendarDays size={18} />
              </div>
              <div className="ref-meta-text">
                <strong>{dateFormatted}</strong>
                <span>{lang === "th" ? `เปิดประตู 18:30 น. • เริ่มการแสดง ${timeFormatted}` : `Doors open 6:30 PM • Starts ${timeFormatted} GMT+7`}</span>
              </div>
            </div>

            <div className="ref-meta-item">
              <div className="ref-meta-icon">
                <MapPin size={18} />
              </div>
              <div className="ref-meta-text">
                <strong>{event.venue.split(",")[0] || "Impact Challenger Hall 1"}</strong>
                <span>{lang === "th" ? "ฮอลล์ยอดนิยม • ความจุรวม 20,000 ที่นั่ง" : "Popular Arena • Seating & Standing Capacity 20,000"}</span>
              </div>
            </div>

            <div className="ref-meta-item">
              <div className="ref-meta-icon">
                <MapPin size={18} />
              </div>
              <div className="ref-meta-text">
                <strong>{lang === "th" ? "กรุงเทพฯ, ประเทศไทย" : "Bangkok, Thailand"}</strong>
                <span>{lang === "th" ? "เมืองทองธานี, นนทบุรี" : "Muang Thong Thani, Nonthaburi"}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="ref-action-row">
            <button className="ref-btn-sell" onClick={() => setShowSellModal(true)}>
              <Tag size={16} />
              {lang === "th" ? "ลงขายตั๋วของคุณ" : "Sell your tickets"}
            </button>
            <button
              className={`ref-btn-action ${userStatus === "interested" ? "active" : ""}`}
              onClick={() => setUserStatus(userStatus === "interested" ? "none" : "interested")}
            >
              ★ {lang === "th" ? "สนใจ" : "Interested"}
            </button>
            <button
              className={`ref-btn-action ${userStatus === "going" ? "active" : ""}`}
              onClick={() => setUserStatus(userStatus === "going" ? "none" : "going")}
            >
              <Check size={15} />
              {lang === "th" ? "จะไปแน่นอน" : "Going"}
            </button>
            <button
              className="ref-btn-share"
              aria-label="Share"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: event.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert(lang === "th" ? "คัดลอกลิงก์เรียบร้อยแล้ว!" : "Link copied to clipboard!");
                }
              }}
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Attendee Preview Box */}
          <div className="ref-attendees-card">
            <div className="ref-attendees-header">
              <strong>{lang === "th" ? "ใครกำลังจะไปบ้าง?" : "Who's going?"}</strong>
              <button onClick={() => alert(lang === "th" ? "แสดงรายชื่อผู้เข้าร่วมที่ได้รับการยืนยัน 116 คนบนบล็อกเชน" : "Showing 116 verified event attendees on-chain.")}>
                {lang === "th" ? "ดูทั้งหมด" : "Show more"}
              </button>
            </div>
            <div className="ref-attendees-sub">
              <b>21</b> {lang === "th" ? "ไปแน่นอน" : "going"} • <b>95</b> {lang === "th" ? "สนใจ" : "interested"}
            </div>
            <div className="ref-attendees-row">
              <div className="ref-avatar-stack">
                <div className="ref-avatar bg-1">MF</div>
                <div className="ref-avatar bg-2">AK</div>
                <div className="ref-avatar bg-3">PT</div>
                <div className="ref-avatar bg-4">SN</div>
                <div className="ref-avatar bg-5">WB</div>
                <div className="ref-avatar more">+111</div>
              </div>
              <span className="ref-connect-prompt">{lang === "th" ? "เชื่อมต่อกระเป๋าเพื่อดูเพื่อนของคุณ" : "Connect wallet to see friends"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clear Tabs separating Booking & Resale */}
        <div className="ref-right-col">
          {/* Main Mode Segmented Control Tabs */}
          <div style={{ display: "flex", background: "#f3f4f6", padding: "4px", borderRadius: "12px", gap: "4px" }}>
            <button
              onClick={() => setActiveTab("primary")}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "9px",
                border: 0,
                fontWeight: 700,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.15s",
                background: activeTab === "primary" ? "#23085a" : "transparent",
                color: activeTab === "primary" ? "#fff" : "#4b5563",
                boxShadow: activeTab === "primary" ? "0 2px 6px rgba(35,8,90,0.2)" : "none",
              }}
            >
              <TicketIcon size={16} />
              {lang === "th" ? "1. จองตั๋วทางการ (Primary Booking)" : "1. Official Booking"}
            </button>
            <button
              onClick={() => setActiveTab("resale")}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "9px",
                border: 0,
                fontWeight: 700,
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.15s",
                background: activeTab === "resale" ? "#23085a" : "transparent",
                color: activeTab === "resale" ? "#fff" : "#4b5563",
                boxShadow: activeTab === "resale" ? "0 2px 6px rgba(35,8,90,0.2)" : "none",
              }}
            >
              <Tag size={16} />
              {lang === "th" ? "2. ตลาดซื้อขายต่อ (Resale Market)" : "2. Fan Resale Market"}
            </button>
          </div>

          {/* TAB 1: OFFICIAL PRIMARY BOOKING */}
          {activeTab === "primary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="ref-tickets-head">
                <div className="ref-tickets-title-wrap">
                  <h2 className="ref-tickets-title">{lang === "th" ? "จองตั๋วคอนเสิร์ต" : "Official Ticket Booking"}</h2>
                  <div className="ref-tickets-counts">
                    <span className="ref-avail-dot" />
                    <span><b>{totalAvailable} {lang === "th" ? "ใบว่าง" : "available"}</b></span>
                    <span>•</span>
                    <span>10-min reservation hold</span>
                  </div>
                </div>
                <div className="ref-cap-badge" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}>
                  <ShieldCheck size={12} />
                  {lang === "th" ? "ออกตั๋ว NFT ทันที" : "Instant NFT Minting"}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="ref-alert-box" style={{ padding: "14px 18px", background: "#f8fafc" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "#111827" }}>{lang === "th" ? "จำนวนตั๋วที่ต้องการจอง" : "Select Ticket Quantity"}</strong>
                  <span style={{ fontSize: "11px", color: "#6b7280" }}>{lang === "th" ? "จำกัด 1 - 6 ใบต่อคำสั่งซื้อ (ระบบล็อกคิว PoW ป้องกันบอท)" : "1 to 6 tickets max per order (Protected by Anti-Bot PoW)"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", display: "grid", placeItems: "center" }}
                  >
                    <Minus size={14} />
                  </button>
                  <b style={{ fontSize: "16px", minWidth: "16px", textAlign: "center" }}>{qty}</b>
                  <button
                    onClick={() => setQty(Math.min(6, qty + 1))}
                    style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", display: "grid", placeItems: "center" }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Ticket Tiers */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {ticketTypes.map((tier, idx) => {
                  const isAvail = tier.available_supply > 0;
                  const priceFormatted = (tier.price_cents / 100).toLocaleString();
                  const isSelected = ticketIndex === idx;

                  return (
                    <div
                      key={tier.id}
                      className={`ref-ticket-card ${isSelected ? "highlighted" : ""}`}
                      onClick={() => setTicketIndex(idx)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="ref-ticket-card-top">
                        <div className="ref-tier-info">
                          <div className="ref-tier-badge-row">
                            <span className="ref-tier-name">{tier.name}</span>
                            <span className={isAvail ? "ref-badge-avail" : "ref-badge-sold"}>
                              {isAvail ? (lang === "th" ? "เปิดจอง" : "AVAILABLE") : (lang === "th" ? "หมดแล้ว" : "SOLD OUT")}
                            </span>
                          </div>
                          <span className="ref-tier-sub">
                            {isAvail
                              ? (lang === "th" ? `คงเหลือ ${tier.available_supply} ใบจากทั้งหมด ${tier.total_supply} ใบ` : `${tier.available_supply} remaining of ${tier.total_supply} total`)
                              : (lang === "th" ? "บัตรโควตาทางการหมดแล้ว สามารถหาซื้อต่อได้ในแท็บ Resale" : "Official allocation sold out. Check fan resale tab.")}
                          </span>
                        </div>
                        <span className={`ref-tier-count-pill ${isAvail ? "" : "sold"}`}>
                          <TicketIcon size={12} />
                          {isAvail ? `${tier.available_supply} left` : "0 available"}
                        </span>
                      </div>

                      <div className="ref-ticket-card-bottom">
                        <div className="ref-price-block">
                          <span className="ref-price-label">{lang === "th" ? "ราคาทางการ" : "OFFICIAL PRICE"}</span>
                          <span className={`ref-price-val ${isAvail ? "" : "sold"}`}>
                            ฿{priceFormatted} <small>({tier.name.includes("VIP") ? "~0.081 ETH" : "~0.038 ETH"})</small>
                          </span>
                        </div>

                        {isAvail ? (
                          <button
                            className="ref-btn-listings"
                            style={{ background: "#23085a", padding: "10px 18px", fontSize: "13px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartPurchaseForTier(idx);
                            }}
                            disabled={reserving}
                          >
                            <Sparkles size={14} />
                            {reserving && isSelected
                              ? (lang === "th" ? "กำลังจองคิว…" : "Locking…")
                              : (lang === "th" ? `จองบัตร (${qty} ใบ)` : `Book ${qty} Ticket${qty > 1 ? "s" : ""}`)}
                          </button>
                        ) : (
                          <button
                            className="ref-btn-waitlist"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab("resale");
                            }}
                          >
                            <Tag size={13} />
                            {lang === "th" ? "ดูบัตร Resale" : "View Resale"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FAN RESALE MARKETPLACE */}
          {activeTab === "resale" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="ref-tickets-head">
                <div className="ref-tickets-title-wrap">
                  <h2 className="ref-tickets-title">{lang === "th" ? "ตลาดตั๋ว Resale แฟนเพลง" : "Fan Resale Exchange"}</h2>
                  <div className="ref-tickets-counts">
                    <span className="ref-avail-dot" />
                    <span><b>3 {lang === "th" ? "รายการพร้อมซื้อ" : "verified listings"}</b></span>
                    <span>•</span>
                    <span>Instant Sepolia transfer</span>
                  </div>
                </div>
                <div className="ref-cap-badge" style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}>
                  <Lock size={12} />
                  {lang === "th" ? "เพดานราคาห้ามเกิน +30%" : "Capped at Original + 30% Max"}
                </div>
              </div>

              {/* Notification & Protection Alert */}
              <div className="ref-alert-box">
                <div className="ref-alert-left">
                  <div className="ref-alert-icon">
                    <Bell size={18} />
                  </div>
                  <div className="ref-alert-text">
                    <strong>{lang === "th" ? "แจ้งเตือนเมื่อมีบัตรปล่อยขาย" : "Ticket alerts"}</strong>
                    <span>{lang === "th" ? "รับการแจ้งเตือนทันทีเมื่อมีผู้ปล่อยขายตั๋วราคาเป็นธรรม" : "Get instant notification when fair resale tickets are listed"}</span>
                  </div>
                </div>
                <div
                  className={`ref-toggle ${alertsOn ? "" : "off"}`}
                  onClick={() => setAlertsOn(!alertsOn)}
                >
                  <div className="ref-toggle-knob" />
                </div>
              </div>

              {/* Action: Sell your tickets banner */}
              <div style={{ background: "#f5f3ff", border: "1px dashed #c4b5fd", borderRadius: "12px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "#5b21b6" }}>{lang === "th" ? "มีตั๋วคอนเสิร์ตแต่ติดธุระไปไม่ได้?" : "Have a ticket but cannot attend?"}</strong>
                  <span style={{ fontSize: "11px", color: "#6b7280", display: "block" }}>{lang === "th" ? "นำมาส่งต่อให้แฟนเพลงตัวจริงอย่างปลอดภัย รับเงินเข้ากระเป๋าทันที" : "Resell securely to real fans. Automatic on-chain payment."}</span>
                </div>
                <button className="ref-btn-sell" style={{ padding: "8px 16px", fontSize: "12px" }} onClick={() => setShowSellModal(true)}>
                  <Tag size={14} />
                  {lang === "th" ? "ลงขายตั๋ว" : "List Ticket"}
                </button>
              </div>

              {/* List of active listings */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { tokenId: 1, tierName: "Regular – Standing Zone A", seller: "0x7F2A...3B91", priceThb: "฿3,500", priceEth: "0.038 ETH", priceWei: parseEther("0.038"), markup: "0% (Original Price)" },
                  { tokenId: 2, tierName: "Regular – Standing Zone A", seller: "0x4C19...8D22", priceThb: "฿3,990", priceEth: "0.043 ETH", priceWei: parseEther("0.043"), markup: "+14% Markup (Fair)" },
                  { tokenId: 3, tierName: "Seats (Reserved Tier 1)", seller: "0x98E1...F5A3", priceThb: "฿4,550", priceEth: "0.049 ETH", priceWei: parseEther("0.049"), markup: "+30% Max Limit Cap" },
                ].map((listing) => (
                  <div key={listing.tokenId} className="ref-listing-item" style={{ background: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "14px", color: "#111827" }}>Ticket NFT #{listing.tokenId}</strong>
                        <span className="ref-badge-avail" style={{ fontSize: "9px" }}>VERIFIED RESALE</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "3px" }}>
                        {listing.tierName} • {listing.markup}
                      </div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>
                        Seller: {listing.seller}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: "800", color: "#23085a", fontSize: "16px" }}>{listing.priceThb}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>{listing.priceEth}</div>
                      </div>
                      <button
                        className="ref-btn-listings"
                        style={{ padding: "8px 16px" }}
                        onClick={() => handleBuyResale(listing.tokenId, listing.priceWei)}
                        disabled={resaleIsPending || resaleIsConfirming}
                      >
                        {resaleIsPending || resaleIsConfirming ? "Processing…" : lang === "th" ? "ซื้อตั๋ว NFT" : "Buy NFT"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <small className="auth-error" style={{ display: "block" }}>{error}</small>}

          {/* Security Guarantee Box */}
          <div className="ref-security-box">
            <div className="ref-security-icon">
              <Shield size={18} />
            </div>
            <div className="ref-security-text">
              <strong>100% Anti-Scalper & Anti-Fraud Guarantee.</strong>{" "}
              {lang === "th"
                ? "ตั๋วทุกใบออกเป็น ERC-721 NFT บน Ethereum Sepolia ตรวจสอบความเป็นเจ้าของได้จริง เพดานราคา Resale ควบคุมไม่เกิน 30% พร้อม Dynamic QR Code สแกนผ่านประตูทางเข้าได้สมบูรณ์แบบ"
                : "Every ticket is minted as a secure ERC-721 NFT on Ethereum Sepolia. Resale is strictly capped at +30% max, with dynamic box office QR codes preventing fraudulent copies."}
            </div>
          </div>
        </div>
      </div>

      {/* Proof of Work (PoW) Anti-Bot Challenge Modal */}
      {powModalOpen && (
        <div className="modal-bg" style={{ zIndex: 100 }}>
          <div className="pow-modal-card">
            <div className="pow-pulse-ring">
              <Lock size={26} color="#c084fc" />
            </div>
            <span className="eyebrow purple" style={{ color: "#a855f7" }}>PROOF OF WORK VERIFICATION</span>
            <h3 style={{ fontSize: "20px", margin: "10px 0 6px" }}>
              {lang === "th" ? "ระบบคิวยืนยันความเป็นมนุษย์ (PoW)" : "Fair Queue Verification"}
            </h3>
            <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
              {lang === "th"
                ? "กำลังประมวลผล Cryptographic PoW ในเบราว์เซอร์เพื่อจองคิวตั๋วที่เป็นธรรม ป้องกันบอทแย่งกดบัตร 100%"
                : "Computing anti-scalper cryptographic PoW challenge in your browser to guarantee zero bots."}
            </p>

            <div className="pow-progress-track">
              <div className="pow-progress-fill" style={{ width: `${powProgress}%` }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
              <span>{powStatusText}</span>
              <span>Nonce #{powNonce}</span>
            </div>

            <div className="pow-hash-stream">
              HASH: {powHash || "0000000000000000000000000000000000000000000000000000000000000000"}
            </div>
          </div>
        </div>
      )}

      {/* Sell Your Ticket Modal */}
      {showSellModal && (
        <div className="modal-bg" style={{ zIndex: 90 }} onClick={() => setShowSellModal(false)}>
          <div className="ref-listings-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span className="eyebrow purple">LIST YOUR NFT TICKET</span>
                <h2 style={{ margin: "4px 0 0", fontSize: "20px" }}>
                  {lang === "th" ? "ลงขายตั๋วต่อ (Resale)" : "List Ticket on Verified Resale"}
                </h2>
              </div>
              <button
                onClick={() => setShowSellModal(false)}
                style={{ background: "none", border: 0, cursor: "pointer", color: "#6b7280" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 16px" }}>
              {lang === "th"
                ? "ลงขายตั๋ว ERC-721 บนเครือข่าย Sepolia โดยระบบจำกัดเพดานราคาห้ามขายเกิน 30% ของราคาหน้าตั๋วเดิม เพื่อคุ้มครองแฟนเพลงและขจัดปัญหาตั๋วผี"
                : "List your ERC-721 ticket on Sepolia. Price is strictly capped at max +30% above original price to eliminate scalping."}
            </p>

            {resaleIsSuccess && (
              <div style={{ padding: "12px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", marginBottom: "12px", color: "#065f46", fontSize: "13px" }}>
                ✓ {lang === "th" ? "ลิสต์ตั๋วขึ้น Smart Contract บนเครือข่าย Sepolia สำเร็จ!" : "Ticket successfully listed on Sepolia contract!"}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "4px" }}>
                  NFT Token ID
                </label>
                <input
                  style={{ width: "100%", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px" }}
                  placeholder={lang === "th" ? "เช่น 1 หรือ 2" : "e.g. 1"}
                  value={sellTokenId}
                  onChange={(e) => setSellTokenId(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "4px" }}>
                  {lang === "th" ? "ราคาที่ต้องการขายต่อ (ETH)" : "Resale Price (ETH)"}
                </label>
                <input
                  style={{ width: "100%", padding: "10px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px" }}
                  placeholder="e.g. 0.038 - max 0.049 ETH"
                  value={sellPriceEth}
                  onChange={(e) => setSellPriceEth(e.target.value)}
                />
                <small style={{ color: "#2563eb", fontSize: "11px", marginTop: "4px", display: "block", fontWeight: "600" }}>
                  {lang === "th" ? "เพดานราคาสูงสุดที่อนุญาต: 0.049 ETH (ห้ามเกิน 30% ของราคาเดิม ฿3,500)" : "Max allowed: ~0.049 ETH (+30% cap above original ฿3,500)"}
                </small>
              </div>

              <button
                className="ref-btn-sell"
                style={{ justifyContent: "center", marginTop: "8px" }}
                onClick={handleListResale}
                disabled={!isConnected || resaleIsPending || resaleIsConfirming}
              >
                {resaleIsPending || resaleIsConfirming
                  ? (lang === "th" ? "กำลังส่งธุรกรรมไปยัง Sepolia…" : "Submitting to Sepolia…")
                  : (lang === "th" ? "ลิสต์ตั๋วขึ้น Smart Contract" : "List Ticket on Smart Contract")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Cart({
  event,
  ticketType,
  qty,
  reservation,
  back,
  checkout,
}: {
  event: LiveEvent;
  ticketType: TicketType;
  qty: number;
  reservation: Reservation | null;
  back: () => void;
  checkout: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!reservation?.expires_at) return;
    const expiry = new Date(reservation.expires_at).getTime();

    const update = () => {
      const rem = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      const m = Math.floor(rem / 60);
      const s = rem % 60;
      setTimeLeft(`${m}:${String(s).padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [reservation]);

  const subtotal = (ticketType.price_cents * qty) / 100;
  const fee = subtotal * 0.08;
  const total = subtotal + fee;

  return (
    <div className="checkout-page">
      <button className="back-link" onClick={back}>
        <ArrowLeft size={16} /> Back to event
      </button>
      <span className="eyebrow purple">YOUR CART</span>
      <h1>Review your reservation</h1>

      <div className="checkout-card">
        {timeLeft && (
          <div style={{ background: "#fef3c7", padding: "12px", borderRadius: "8px", color: "#92400e", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
            <Clock size={16} />
            <span>Reservation held! Expires in <b>{timeLeft}</b></span>
          </div>
        )}
        <div className="cart-event">
          <img src={event.image_url || ""} alt={event.title} />
          <div>
            <h3>{event.title}</h3>
            <p>{event.venue}</p>
            <span>{ticketType.name} · {qty} ticket{qty > 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="price-line">
          <span>Tickets</span>
          <b>${subtotal.toFixed(2)}</b>
        </div>
        <div className="price-line">
          <span>Service fee <small>8%</small></span>
          <b>${fee.toFixed(2)}</b>
        </div>
        <div className="total-line">
          <span>Total</span>
          <b>${total.toFixed(2)}</b>
        </div>
        <button className="purple-button full" onClick={checkout}>
          Proceed to Checkout <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function Checkout({
  event,
  ticketType,
  qty,
  reservation,
  back,
  onSuccess,
}: {
  event: LiveEvent;
  ticketType: TicketType;
  qty: number;
  reservation: Reservation | null;
  back: () => void;
  onSuccess: (orderData: { order_id: string; total_cents: number; quantity: number; ticket_ids: string[]; ticket_type_name: string }) => void;
}) {
  const { address } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [buyerWallet, setBuyerWallet] = useState(address || "");

  useEffect(() => {
    if (address) setBuyerWallet(address);
  }, [address]);

  const subtotal = (ticketType.price_cents * qty) / 100;
  const total = (subtotal * 1.08).toFixed(2);

  const handlePay = async () => {
    if (!reservation) {
      setError("No active reservation found. Please choose your tickets again.");
      return;
    }
    setBusy(true);
    setError("");

    try {
      let order: { order_id: string; total_cents: number; quantity: number; ticket_ids: string[]; ticket_type_name: string };

      if (reservation.id.startsWith("res-demo-")) {
        // Instant simulated completion for demo catalog items
        const demoTicketId = "ticket-demo-" + Date.now();
        const demoCode = "UT3-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        order = {
          order_id: "demo-" + Date.now().toString(36),
          total_cents: ticketType.price_cents * qty,
          quantity: qty,
          ticket_ids: [demoTicketId],
          ticket_type_name: ticketType.name,
        };

        // Persist demo ticket to local store for instant My Tickets & Resale testing
        try {
          const localStored = JSON.parse(window.localStorage.getItem("ut3_local_tickets") || "[]");
          localStored.unshift({
            id: demoTicketId,
            order_id: order.order_id,
            ticket_type_id: ticketType.id,
            ticket_code: demoCode,
            qr_payload: `ut3://ticket/${demoCode}/${order.order_id}`,
            status: "VALID",
            token_id: null,
            created_at: new Date().toISOString(),
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
          });
          window.localStorage.setItem("ut3_local_tickets", JSON.stringify(localStored));
        } catch (storageErr) {
          console.warn("Storage notice:", storageErr);
        }
      } else {
        order = await completePurchase(reservation.id, buyerWallet || "0x0000000000000000000000000000000000000000");
      }

      if (buyerWallet && buyerWallet.startsWith("0x") && buyerWallet.length === 42) {
        try {
          const res = await fetch("/api/mint", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: buyerWallet,
              eventId: event.id,
              ticketType: ticketType.id,
              orderId: Date.now(),
              metadataURI: `ipfs://u-ticket-3/event-${event.id}-order-${order.order_id}.json`,
            }),
          });
          const mintData = await res.json();
          if (mintData.success && order.ticket_ids && order.ticket_ids.length > 0) {
            if (!reservation.id.startsWith("res-demo-")) {
              await linkTicketNft(order.ticket_ids[0], Number(mintData.tokenId), mintData.transactionHash);
            } else {
              // Update local ticket with minted token ID
              try {
                const localStored = JSON.parse(window.localStorage.getItem("ut3_local_tickets") || "[]");
                if (localStored.length > 0 && localStored[0].id === order.ticket_ids[0]) {
                  localStored[0].token_id = Number(mintData.tokenId);
                  window.localStorage.setItem("ut3_local_tickets", JSON.stringify(localStored));
                }
              } catch (_) {}
            }
          }
        } catch (mintErr) {
          console.warn("Minting automation notice:", mintErr);
        }
      }

      onSuccess(order);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment processing failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="checkout-page">
      <button className="back-link" onClick={back}>
        <ArrowLeft size={16} /> Back to cart
      </button>
      <span className="eyebrow purple">SECURE CHECKOUT</span>
      <h1>Complete your order</h1>

      <div className="checkout-form">
        <label>
          Recipient Ethereum Sepolia Wallet (for NFT ticket ownership)
          <input
            placeholder="0x..."
            value={buyerWallet}
            onChange={(e) => setBuyerWallet(e.target.value)}
          />
        </label>

        <div className="mock-stripe">
          <TicketIcon size={18} />
          <span>
            <b>Payment Method</b>
            <small>Test Checkout · Real order & NFT ticket recorded on completion</small>
          </span>
        </div>

        {error && <small className="auth-error">{error}</small>}

        <button className="purple-button full" onClick={handlePay} disabled={busy}>
          {busy ? "Finalizing order and issuing tickets…" : `Confirm & Pay $${total}`}
          {!busy && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}

function Success({
  order,
  event,
  onViewTickets,
}: {
  order: { order_id: string; total_cents: number; quantity: number; ticket_ids: string[]; ticket_type_name: string } | null;
  event: LiveEvent;
  onViewTickets: () => void;
}) {
  return (
    <div className="success">
      <div>✓</div>
      <span className="eyebrow purple">ORDER CONFIRMED</span>
      <h1>You&apos;re going to<br /><em>{event.title}</em></h1>
      <p>
        Your digital ticket is ready! Order #{order?.order_id?.slice(0, 8) || "SUCCESS"} ·
        {order?.quantity || 1} {order?.ticket_type_name || "Tickets"}
      </p>
      <button className="purple-button" onClick={onViewTickets}>
        View in My Tickets <TicketIcon size={16} />
      </button>
    </div>
  );
}

function Auth({ onDone }: { onDone: () => void }) {
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const result = register
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setBusy(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectUrl = typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        if (error.message?.includes("provider is not enabled") || (error as any).code === "validation_failed") {
          throw new Error("ระบบ Google Login ยังไม่ได้เปิดใช้งานใน Supabase Dashboard (ไปที่ Authentication > Providers > Google แล้วกด Enable)");
        }
        throw error;
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Google authentication failed");
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="eyebrow purple">U TICKET 3 ACCOUNT</span>
        <h1>{register ? "Create your account" : "Welcome back"}</h1>
        <p>Save tickets, manage orders and collect every moment.</p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={busy}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "12px 16px",
            border: "1px solid var(--line)",
            borderRadius: "7px",
            background: "#fff",
            color: "var(--ink)",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            marginTop: "16px",
            transition: "0.2s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", margin: "20px 0", color: "var(--muted)", fontSize: "12px" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
          <span style={{ padding: "0 10px" }}>or with email</span>
          <div style={{ flex: 1, height: "1px", background: "var(--line)" }} />
        </div>

        {register && (
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input placeholder="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <small className="auth-error">{error}</small>}
        <button className="purple-button full" onClick={submit} disabled={busy}>
          {busy ? "Please wait…" : register ? "Create account" : "Log in"}
          {!busy && <ArrowRight size={16} />}
        </button>
        <button className="auth-switch" onClick={() => setRegister(!register)}>
          {register ? "Already have an account? Log in" : "New here? Create an account"}
        </button>
        <small>Supabase Auth · Secure credentials & Google OAuth</small>
      </div>
    </div>
  );
}

function MyTickets({ event }: { event: LiveEvent }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQr, setActiveQr] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Query only genuine tickets issued to the authenticated user from Supabase database
      const list = await getMyTickets();
      setTickets(list);
    } catch (e) {
      console.error("Error fetching genuine tickets:", e);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="tickets-page">
      <span className="eyebrow purple">YOUR COLLECTION</span>
      <h1>My tickets & Resale</h1>

      <OwnedTicketCollection event={event} />

      <section style={{ marginTop: "32px", marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2>Your Issued Tickets ({tickets.length})</h2>
          <button className="outline-button" onClick={fetchTickets} style={{ margin: 0, padding: "6px 12px", display: "flex", gap: "6px", alignItems: "center" }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading && <p>Loading your genuine tickets from Supabase…</p>}

        {!loading && tickets.length === 0 && (
          <div className="empty-tickets">
            <TicketIcon size={24} />
            <div>
              <b>No tickets purchased on this account yet</b>
              <span>Browse events to reserve and purchase your genuine ticket.</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {tickets.map((t) => {
            const ev = t.ticket_types?.events || event;
            const isUsed = t.status === "USED";
            return (
              <div className="my-ticket" key={t.id} style={{ alignItems: "center" }}>
                <img src={ev.image_url || event.image_url || ""} alt={ev.title} />
                <div>
                  <span className={isUsed ? "valid checked" : "valid"}>
                    ● {isUsed ? "Checked in / Used" : "Valid ticket"}
                  </span>
                  <h2>{ev.title}</h2>
                  <p>{ev.venue}</p>
                  <b>{t.ticket_types?.name || "General Admission"} · Code: {t.ticket_code}</b>

                  {t.token_id && (
                    <small style={{ display: "block", color: "var(--purple)", marginTop: "6px", fontWeight: "bold" }}>
                      NFT Token #{t.token_id} linked on Ethereum Sepolia
                    </small>
                  )}

                  <button
                    className="outline-button"
                    onClick={() => setActiveQr(activeQr === t.id ? null : t.id)}
                  >
                    {activeQr === t.id ? "Hide QR" : "Show QR / Verify ticket"}
                  </button>
                </div>
                <div className="qr-code" style={{ minWidth: "210px", minHeight: "210px", padding: "16px" }}>
                  {activeQr === t.id ? (
                    <div style={{ background: "#fff", padding: "12px", borderRadius: "10px", border: "1px solid var(--line)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <QRCodeSVG value={t.qr_payload || t.ticket_code} size={180} level="H" includeMargin />
                      <small style={{ marginTop: "8px", fontWeight: "600", color: "var(--purple)", fontSize: "11px" }}>Official Entry Pass</small>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }} onClick={() => setActiveQr(t.id)}>
                      <span style={{ fontSize: "64px", lineHeight: 1 }}>▦</span>
                      <small style={{ marginTop: "6px" }}>Click to enlarge QR</small>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ResalePanel />
      <ResaleBuyerPanel />
    </div>
  );
}

function OwnedTicketCollection({ event }: { event: LiveEvent }) {
  const { address } = useAccount();
  const { data: nextToken } = useReadContract({
    address: ticketContractAddress,
    abi: ticketContractAbi,
    functionName: "nextTokenId",
  });
  const total = nextToken ? Number(nextToken) - 1 : 0;
  const calls = Array.from({ length: Math.min(total, 50) }, (_, i) => ({
    address: ticketContractAddress,
    abi: ticketContractAbi,
    functionName: "ownerOf" as const,
    args: [BigInt(i + 1)] as const,
  }));

  const owners = useReadContracts({
    contracts: calls,
    query: { enabled: Boolean(address && total > 0) },
  });

  const owned = owners.data
    ?.map((result, i) => ({ tokenId: i + 1, owner: result.result as string | undefined }))
    .filter((t) => t.owner && address && t.owner.toLowerCase() === address.toLowerCase()) || [];

  return (
    <section className="owned-collection">
      <div className="collection-summary">
        <div>
          <strong>{owned.length}</strong>
          <span>NFT tickets owned by connected wallet</span>
        </div>
        <small>
          {owners.isLoading ? "Reading blockchain ownership…" : `${total} total tokens minted on Ethereum Sepolia`}
        </small>
      </div>

      {owned.length === 0 && !owners.isLoading && (
        <div className="empty-tickets">
          <TicketIcon size={24} />
          <div>
            <b>No on-chain NFT tickets detected for your wallet</b>
            <span>Connect your wallet to inspect tokens or mint one with the owner wallet.</span>
          </div>
        </div>
      )}

      {owned.length > 0 && (
        <div className="owned-grid">
          {owned.map((ticket) => (
            <article className="owned-card" key={ticket.tokenId}>
              <img src={event.image_url || ""} alt={event.title} />
              <div>
                <span className="valid">● On-chain Verified</span>
                <h3>{event.title}</h3>
                <strong>Token #{ticket.tokenId}</strong>
                <small>U Ticket 3 · Sepolia Contract</small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ResalePanel() {
  const { address, isConnected } = useAccount();
  const [tokenId, setTokenId] = useState("");
  const [price, setPrice] = useState("0.00011");
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const owner = useReadContract({
    address: ticketContractAddress,
    abi: ticketContractAbi,
    functionName: "ownerOf",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: Boolean(tokenId) },
  });

  const original = useReadContract({
    address: ticketContractAddress,
    abi: ticketContractAbi,
    functionName: "originalPriceWei",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: Boolean(tokenId) },
  });

  const list = async () => {
    if (!tokenId) return;
    writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "list",
      args: [BigInt(tokenId), parseEther(price)],
    });
  };

  const cancel = () => {
    if (!tokenId) return;
    writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "cancelListing",
      args: [BigInt(tokenId)],
    });
  };

  const owns = Boolean(address && owner.data && String(owner.data).toLowerCase() === address.toLowerCase());

  return (
    <div className="resale-panel">
      <h2>List your ticket for Resale</h2>
      <p>
        Sell your NFT ticket fairly. The smart contract enforces a maximum 10% cap above the original price to prevent scalping.
      </p>

      <div className="resale-fields">
        <input
          aria-label="Token ID"
          placeholder="Token ID"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value.replace(/\D/g, ""))}
        />
        <input
          aria-label="Resale price"
          placeholder="ETH price (max +10%)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      {original.data && (
        <small>
          Original price: {Number(original.data) / 1e18} ETH · Maximum resale limit: +10%
        </small>
      )}

      <div className="resale-actions">
        <button
          className="purple-button"
          disabled={!isConnected || !owns || isPending || isLoading}
          onClick={list}
        >
          {isPending || isLoading ? "Confirming on chain…" : "List for resale"}
        </button>
        <button
          className="outline-button"
          disabled={!isConnected || !owns || isPending || isLoading}
          onClick={cancel}
        >
          Cancel listing
        </button>
      </div>

      {owner.error && <small className="auth-error">Token not found or not yet minted.</small>}
      {!owns && tokenId && owner.data && (
        <small className="auth-error">Your connected wallet is not the owner of token #{tokenId}.</small>
      )}
      {(hash || isSuccess) && (
        <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">
          View transaction on Sepolia Etherscan ↗
        </a>
      )}
      {error && <small className="auth-error">{error.message.slice(0, 140)}</small>}
    </div>
  );
}

function ResaleBuyerPanel() {
  const { address, isConnected } = useAccount();
  const [tokenId, setTokenId] = useState("");
  const { data: listing, error: listingError } = useReadContract({
    address: ticketContractAddress,
    abi: ticketContractAbi,
    functionName: "listings",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: Boolean(tokenId) },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const seller = listing?.[0] as `0x${string}` | undefined;
  const price = listing?.[1] as bigint | undefined;
  const available = Boolean(seller && seller !== "0x0000000000000000000000000000000000000000" && price && price > BigInt(0));
  const sameOwner = Boolean(address && seller && address.toLowerCase() === seller.toLowerCase());

  const buy = () => {
    if (!tokenId || !price) return;
    writeContract({
      address: ticketContractAddress,
      abi: ticketContractAbi,
      functionName: "buy",
      args: [BigInt(tokenId)],
      value: price,
    });
  };

  return (
    <div className="resale-panel buyer-panel">
      <span className="eyebrow purple">BUY FROM ANOTHER FAN</span>
      <h2>Find a resale ticket</h2>
      <p>
        Enter a listed token ID to verify its on-chain listing. The contract automatically pays the creator royalty and transfers NFT ownership in a single transaction.
      </p>

      <div className="resale-fields">
        <input
          aria-label="Resale token ID"
          placeholder="Token ID to buy"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      {available && (
        <div className="listing-summary">
          <span>Listed by <b>{seller?.slice(0, 6)}…{seller?.slice(-4)}</b></span>
          <strong>{price ? Number(price) / 1e18 : 0} ETH</strong>
        </div>
      )}

      {tokenId && listingError && <small className="auth-error">This token is not available or has no active listing.</small>}
      {tokenId && !available && !listingError && <small>No active listing found for token #{tokenId}.</small>}

      <button
        className="purple-button"
        disabled={!isConnected || !available || sameOwner || isPending || isLoading}
        onClick={buy}
      >
        {isPending || isLoading ? "Confirming purchase…" : isSuccess ? "Ticket purchased ✓" : "Buy resale ticket"}
      </button>

      {sameOwner && <small>You cannot buy your own listing.</small>}
      {!isConnected && <small>Connect MetaMask before purchasing.</small>}
      {(hash || isSuccess) && (
        <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">
          View purchase on Sepolia Etherscan ↗
        </a>
      )}
      {error && <small className="auth-error">{error.message.slice(0, 140)}</small>}
    </div>
  );
}

function Organizer({ events }: { events: LiveEvent[] }) {
  const [ticketCode, setTicketCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  const handleVerify = async () => {
    if (!ticketCode) return;
    setScanning(true);
    setError("");
    setResult(null);

    try {
      const res = await checkInTicket(ticketCode.trim().toUpperCase());
      if (!res.success) {
        setError(res.error === "ALREADY_USED" ? "This ticket has already been checked in!" : "Ticket code invalid or not found.");
      } else {
        setResult(res);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="organizer-page">
      <span className="eyebrow purple">ORGANIZER SPACE</span>
      <h1>Gate Check-In & Event Management</h1>

      <div className="organizer-stats">
        <div>
          <small>ACTIVE EVENTS</small>
          <b>{events.length}</b>
          <span>Live on Supabase</span>
        </div>
        <div>
          <small>SMART CONTRACT</small>
          <b style={{ fontSize: "16px", wordBreak: "break-all" }}>{ticketContractAddress.slice(0, 10)}…</b>
          <span>Ethereum Sepolia</span>
        </div>
        <div>
          <small>STATUS</small>
          <b>Operational</b>
          <span>10% Resale Cap Active</span>
        </div>
      </div>

      <div className="organizer-table">
        <h2>Gate Check-In Scanner</h2>
        <p>Verify attendee ticket code or QR payload against Supabase and Blockchain.</p>

        <div style={{ display: "flex", gap: "10px", marginTop: "16px", maxWidth: "500px" }}>
          <input
            placeholder="Enter ticket code (e.g. UT3-ABC12345)"
            value={ticketCode}
            onChange={(e) => setTicketCode(e.target.value)}
            style={{ flex: 1, padding: "12px", border: "1px solid var(--line)", borderRadius: "6px" }}
          />
          <button className="purple-button" onClick={handleVerify} disabled={scanning}>
            {scanning ? "Verifying…" : "Check In"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: "16px", padding: "12px", background: "#fee2e2", color: "#991b1b", borderRadius: "6px" }}>
            [Invalid] {error}
          </div>
        )}

        {result && result.success && (
          <div style={{ marginTop: "16px", padding: "16px", background: "#dcfce7", color: "#166534", borderRadius: "6px" }}>
            <h3>Valid Ticket Checked In</h3>
            <p>Event: <b>{result.event_title}</b></p>
            <p>Tier: <b>{result.ticket_type}</b></p>
            <p>Code: <b>{result.ticket_code}</b></p>
          </div>
        )}
      </div>
    </div>
  );
}

function WalletModal({ close }: { close: () => void }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="modal-bg" onClick={close}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} aria-label="Close"><X /></button>
        <Wallet size={28} />
        <h2>{isConnected ? "Wallet connected" : "Connect your wallet"}</h2>
        {isConnected ? (
          <>
            <p className="wallet-address">{address}</p>
            <button className="wallet-option" onClick={() => { disconnect(); close(); }}>
              Disconnect <X size={15} />
            </button>
          </>
        ) : (
          <>
            <p>Connect MetaMask to collect U Ticket 3 NFTs on Ethereum Sepolia testnet.</p>
            {connectors.map((c) => (
              <button
                className="wallet-option"
                key={c.uid}
                disabled={isPending}
                onClick={() => connect({ connector: c })}
              >
                {isPending ? "Connecting…" : c.name}
                <ArrowRight size={15} />
              </button>
            ))}
          </>
        )}
        <small>Ethereum Sepolia only · Never share your seed phrase</small>
      </div>
    </div>
  );
}
