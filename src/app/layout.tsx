import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contributors Helper",
  description: "Ask questions about our team calls",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
