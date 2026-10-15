import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "ChainTicket — Own the moment", description: "Web3 concert ticketing for the next generation." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
