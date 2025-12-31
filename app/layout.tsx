import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow | Smart Task Management",
  description: "A professional task management application with AI-powered features and live dashboard analytics.",
  openGraph: {
    title: "TaskFlow | Smart Task Management",
    description: "Manage your tasks efficiently with AI insights and a live dashboard.",
    url: "https://taskflow-app-v2.vercel.app",
    siteName: "TaskFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskFlow | Smart Task Management",
    description: "Manage your tasks efficiently with AI insights and a live dashboard.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
