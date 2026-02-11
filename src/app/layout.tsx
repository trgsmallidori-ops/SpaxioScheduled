import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ConsentProvider } from "@/contexts/ConsentContext";
import { ConsentModal } from "@/components/ConsentModal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { defaultMeta, SITE_URL, ogImageUrl, buildJsonLd } from "@/lib/seo";

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
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: "SpaxioScheduled - AI School Calendar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultMeta.title,
    description: defaultMeta.description,
    images: [ogImageUrl],
  },
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: SITE_URL },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "48x48" },
      { url: "/logo.png", type: "image/png", sizes: "32x32" },
    ],
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
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href={`${SITE_URL}/logo.png`} type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href={`${SITE_URL}/logo.png`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('spaxio-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body className={`min-h-screen w-full ${nunito.className} antialiased text-[var(--text)] bg-[var(--bg)]`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <ConsentProvider>
            <LocaleProvider>
              <Header />
              <main className="w-full min-h-[calc(100vh-4rem)] bg-[var(--bg)] flex flex-col">
                {children}
              </main>
              <Footer />
              <ConsentModal />
            </LocaleProvider>
          </ConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
