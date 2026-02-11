import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { Header } from "@/components/Header";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SpaxioScheduled — Your syllabus, one calendar",
  description:
    "Upload your course syllabus. We extract assignments, tests, and schedule into one calendar with reminders.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className={`min-h-screen w-full ${nunito.className} antialiased text-[var(--text)] bg-[var(--bg)]`}>
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
