import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gamma — ML Development Platform",
  description: "Unified ML development platform built on the GAMMA stack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
