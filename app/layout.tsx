import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bug Squasher: DOM Defense",
  description: "A small TypeScript canvas game about squashing production bugs before they hit the server.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
