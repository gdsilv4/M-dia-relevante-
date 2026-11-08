import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: { default: "Painel de Mídia", template: "%s · Painel de Mídia" },
  description: "Planejamento de conteúdo e demandas de design da mídia da Igreja Relevante.",
  applicationName: "Painel de Mídia",
  appleWebApp: { capable: true, title: "Painel de Mídia", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#101B35",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
