import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus | Secretar.ia",
  description: "Plataforma de inteligência e automação clínica Nexus.",
  icons: {
    icon: "/logo-lumina.png",
    apple: "/logo-lumina.png",
  },
  openGraph: {
    title: "Nexus | Secretar.ia",
    description: "Plataforma de inteligência e automação clínica Nexus.",
    images: [{ url: "/logo-lumina.png", width: 800, height: 600, alt: "Nexus Logo" }],
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
        {children}
      </body>
    </html>
  );
}
