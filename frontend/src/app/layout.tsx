import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alignzo - Enterprise Team Productivity Platform",
  description: "Modern team productivity platform for enterprise organizations",
  keywords: ["productivity", "team management", "time tracking", "enterprise"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-gray-50`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `console.info('Frontend starting in:', '${process.env.ALIGNZO_START_MODE}');console.info('Config source:', '${process.env.ALIGNZO_CONFIG_SOURCE||'none'}');console.info('NEXT_PUBLIC_API_URL:', '${process.env.NEXT_PUBLIC_API_URL||'missing'}');`,
          }}
        />
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
