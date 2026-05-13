import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dream-phone.vercel.app"),
  title: "Dream Phone",
  description: "A dream phone for Kelli to celebrate 15 years of marriage.",
  openGraph: {
    title: "Dream Phone",
    description: "A dream phone for Kelli to celebrate 15 years of marriage.",
    url: "https://dream-phone.vercel.app",
    siteName: "Dream Phone",
    images: [
      {
        url: "/assets/board.jpg",
        width: 1200,
        height: 630,
        alt: "Dream Phone game board",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dream Phone",
    description: "A dream phone for Kelli to celebrate 15 years of marriage.",
    images: ["/assets/board.jpg"],
  },
  appleWebApp: {
    capable: true,
    title: "Dream Phone",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1c0030",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
