import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cevora — Online CV Builder",
  applicationName: "Cevora",
  description: "Create your CV in English or Arabic with customizable templates, fonts, and PDF export.",
  icons: { icon: "/branding/cevora-icon.png", apple: "/branding/cevora-icon.png" },
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
