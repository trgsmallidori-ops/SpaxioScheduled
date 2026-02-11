import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { Header } from "@/components/Header";
import { defaultMeta, SITE_URL, buildJsonLd } from "@/lib/seo";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultMeta.title,
    template: "%s | SpaxioScheduled",
  },
  description: defaultMeta.description,
  keywords: defaultMeta.keywords,
  authors: [{ name: "SpaxioScheduled", url: SITE_URL }],
  creator: "SpaxioScheduled",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "SpaxioScheduled",
    title: defaultMeta.title,
    description: defaultMeta.description,
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "SpaxioScheduled - AI School Calendar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultMeta.title,
    description: defaultMeta.description,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: SITE_URL },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  category: "education",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = buildJsonLd();

  return (
    <html lang="en" className={nunito.variable}>
      <body className={`min-h-screen w-full ${nunito.className} antialiased text-[var(--text)] bg-[var(--bg)]`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LocaleProvider>
          <Header />
          <main className="w-full min-h-[calc(100vh-4rem)] bg-[var(--bg)]">
            {children}
          </main>
        </LocaleProvider>
      </body>
    </html>
  );
}
