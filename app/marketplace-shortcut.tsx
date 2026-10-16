"use client";

import { ShoppingCart } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MarketplaceShortcut() {
  const pathname = usePathname();

  if (pathname === "/marketplace") return null;

  return (
    <div className="marketplace-shortcut-strip">
      <a className="marketplace-shortcut" href="/marketplace" aria-label="Marketplace, view ETH balance">
        <ShoppingCart size={17} aria-hidden="true" />
        <span>Marketplace</span>
        <small>View ETH balance</small>
      </a>
    </div>
  );
}