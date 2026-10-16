"use client";

import { useState } from "react";
import { ArrowUp, ExternalLink, MessageCircle, Sparkles, X } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; text: string };

const quickQuestions = [
  "How do I buy a demo ticket?",
  "How do I resell my ticket?",
  "Where can I see my ETH balance?",
];

function getAnswer(question: string) {
  const text = question.toLowerCase();

  if (/balance|\beth\b|wallet|coin|ยอด|เหรียญ/.test(text)) {
    return "Open Marketplace and connect your wallet to see its Sepolia ETH balance. Sepolia ETH is testnet currency, not fiat or mainnet money. Mock purchases do not move funds.";
  }
  if (/resale|resell|sell|ขาย|ขายต่อ/.test(text)) {
    return "In Marketplace, open My tickets and set a resale price for a ticket you own. For Mock tickets, the price cap is 10% above the original demo price. Switch from User A to User B to test buying your listing.";
  }
  if (/mock|demo|buy|purchase|ticket|ตั๋ว|ซื้อ/.test(text)) {
    return "Open Marketplace → Primary tickets → Mock ticket store, choose a demo user, then select Buy demo ticket. The ticket and QR code are saved in this browser under My tickets. No payment is taken.";
  }
  if (/on.chain|mainnet|real money|เงินจริง|blockchain|sepolia|testnet/.test(text)) {
    return "On-chain ticket purchases use Sepolia ETH and require an active sale configured by the contract owner. Sepolia is a test network, not a real-money payment service. The standard checkout is still a demo flow.";
  }
  return "I can help with demo purchases, ticket resale, wallet balances, and Sepolia. For broader AI assistance, open U.Bot using the partner link below.";
}

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Hi! I can help with tickets, resale, and wallet balances. These quick answers are for U Ticket; U.Bot is available for broader AI help." },
  ]);

  const sendMessage = (question: string) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    setMessages((current) => [
      ...current,
      { role: "user", text: cleanQuestion },
      { role: "assistant", text: getAnswer(cleanQuestion) },
    ]);
    setInput("");
  };

  return (
    <>
      {open && (
        <section className="support-chat" aria-label="U Ticket support chat">
          <header className="support-chat-header">
            <div className="support-chat-mark"><Sparkles size={17} /></div>
            <div className="support-chat-title"><strong>Ticket help</strong><span>Quick answers for U Ticket</span></div>
            <button type="button" className="support-chat-close" aria-label="Close help chat" onClick={() => setOpen(false)}><X size={18} /></button>
          </header>
          <div className="support-chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <p className={`support-chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</p>
            ))}
            {messages.length === 1 && (
              <div className="support-chat-quick-questions">
                {quickQuestions.map((question) => <button type="button" key={question} onClick={() => sendMessage(question)}>{question}</button>)}
              </div>
            )}
          </div>
          <div className="support-chat-partner">
            <span>Need broader AI help?</span>
            <a href="https://u.bot/" target="_blank" rel="noreferrer">Open U.Bot <ExternalLink size={13} /></a>
          </div>
          <form className="support-chat-form" onSubmit={(event) => { event.preventDefault(); sendMessage(input); }}>
            <input aria-label="Ask a ticket question" placeholder="Ask about tickets or payments" value={input} onChange={(event) => setInput(event.target.value)} />
            <button type="submit" aria-label="Send message" disabled={!input.trim()}><ArrowUp size={18} /></button>
          </form>
        </section>
      )}
      <button type="button" className={`support-chat-launcher ${open ? "open" : ""}`} aria-label={open ? "Close ticket help" : "Open ticket help"} onClick={() => setOpen((current) => !current)}>
        {open ? <X size={19} /> : <MessageCircle size={19} />}
        <span>{open ? "Close" : "Ticket help"}</span>
      </button>
    </>
  );
}