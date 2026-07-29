import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://cosmoplex-kappa.vercel.app"; // update if you move to a custom domain
const SITE_DESC =
  "Five specialist AI agents teach, test, and certify your understanding of artificial intelligence — at your pace, in your language.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cosmoplex — AI Literacy, in your language",
    template: "%s · Cosmoplex",
  },
  description: SITE_DESC,
  applicationName: "Cosmoplex",
  keywords: ["AI literacy", "learn AI", "AI course", "certificate", "Hindi", "Marathi", "Telugu", "Tamil", "Kannada"],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Cosmoplex",
    title: "Cosmoplex — AI Literacy, in your language",
    description: SITE_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: "Cosmoplex — AI Literacy, in your language",
    description: SITE_DESC,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  );
}
