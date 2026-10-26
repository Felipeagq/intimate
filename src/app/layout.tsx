import type { Metadata, Viewport } from "next";
import { Montserrat, Inria_Serif } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const inriaSerif = Inria_Serif({
  variable: "--font-inria",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://intimate.app"),
  title: {
    default: "Intimate — Un noviazgo con Dios en el centro",
    template: "%s · Intimate",
  },
  description:
    "Devocional en pareja, oración del uno por el otro y acuerdos escritos. La app para novios cristianos que quieren construir su relación con Dios en el centro.",
  applicationName: "Intimate",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Intimate",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Intimate",
    title: "Intimate — Un noviazgo con Dios en el centro",
    description:
      "El ritual compartido de los dos: devocional en pareja, oración mutua y acuerdos claros.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#1f1918" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} ${inriaSerif.variable}`}>
        <div className="aurora" aria-hidden="true" />
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
