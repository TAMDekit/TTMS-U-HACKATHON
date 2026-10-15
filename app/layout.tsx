import type { Metadata } from "next";
import "./globals.css";
import "./brand.css";
import Providers from "./providers";
import UXSync from "./ux-sync";

export const metadata: Metadata = { title: "U Ticket 3 — Own the moment", description: "Web3 event ticketing for the next generation." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Providers><UXSync />{children}</Providers></body></html>; }
