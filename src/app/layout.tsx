import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Newsletter to Podcast",
  description: "Turn your newsletters into listenable podcast episodes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-6">
            <Link
              href="/"
              className="font-semibold text-lg hover:opacity-80 transition-opacity"
            >
              Newsletter to Podcast
            </Link>
            <div className="flex gap-4 text-sm">
              <Link
                href="/"
                className="hover:underline underline-offset-4"
              >
                New Episode
              </Link>
              <Link
                href="/episodes"
                className="hover:underline underline-offset-4"
              >
                All Episodes
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
