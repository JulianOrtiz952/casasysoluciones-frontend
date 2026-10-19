import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";
import { AlertProvider } from "./alert-provider";
import { ConsoleSuppressor } from "./ConsoleSuppressor";
import { SITE_URL } from "@/lib/properties";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Casas y Soluciones | Inmuebles en Norte de Santander",
    template: "%s | Casas y Soluciones",
  },
  description: "Inmuebles disponibles en arriendo en Cúcuta y Norte de Santander.",
  applicationName: "Casas y Soluciones",
  authors: [{ name: "Casas y Soluciones" }],
  creator: "Casas y Soluciones",
  publisher: "Casas y Soluciones",
  formatDetection: { email: false, address: false, telephone: false },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  icons: {
    icon: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CO">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConsoleSuppressor />
        <ThemeProvider>
          <AlertProvider>
            {children}
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


