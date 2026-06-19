import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Material Passport — Open Source Digital Material Registry",
  description:
    "An open-source platform for creating, managing, and tracking digital material passports for circular economy and sustainable construction.",
  keywords: [
    "material passport",
    "circular economy",
    "sustainable construction",
    "BIM",
    "digital materials",
    "open source",
    "lifecycle tracking",
    "sustainability",
  ],
  authors: [{ name: "Material Passport Contributors" }],
  openGraph: {
    title: "Material Passport",
    description:
      "Open-source platform for digital material passports and circular economy tracking.",
    type: "website",
    siteName: "Material Passport",
  },
  twitter: {
    card: "summary_large_image",
    title: "Material Passport",
    description:
      "Open-source platform for digital material passports and circular economy tracking.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
