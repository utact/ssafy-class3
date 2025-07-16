import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSAFY Class 3",
  description: "A seating arrangement application for SSAFY Class 3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
