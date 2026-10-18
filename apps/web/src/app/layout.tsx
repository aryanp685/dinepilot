import type { Metadata } from "next";
import "@/styles/globals.css";
import { AppProviders } from "@/providers/AppProviders";

export const metadata: Metadata = {
  title: "DinePilot — Restaurant Profitability, Inventory & QR Operations SaaS",
  description:
    "Know which dishes make money, control ingredient shrinkage, run multi-KOT QR table ordering, and automate GST & kitchen operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F7F3] text-[#101820] antialiased selection:bg-[#176B52] selection:text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
