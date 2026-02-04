import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthRedirectHandler from "@/app/auth-redirect-handler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus | Secretar.ia",
  description: "Plataforma de inteligência e automação clínica Nexus.",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Nexus | Secretar.ia",
    description: "Plataforma de inteligência e automação clínica Nexus.",
    images: [{ url: "/icon.svg", width: 800, height: 600, alt: "Nexus Logo" }],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} antialiased`}>
        <AuthRedirectHandler />
        {children}
        <Toaster position="top-center" richColors theme="dark" />
      </body>
    </html>
  );
}
