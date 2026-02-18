import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WEBFINDLEAD - Local Business Scanner",
  description: "Find local businesses without websites instantly.",
  icons: {
    icon: [
      { url: "/Faviconn/logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/Faviconn/apple-touch-icon.png" },
    ],
  },
  manifest: "/Faviconn/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={inter.className}
        suppressHydrationWarning
      >
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
