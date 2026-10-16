import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth-provider";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Contributors Helper",
  description: "Ask questions about our team calls",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}