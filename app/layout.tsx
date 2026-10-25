import type { Metadata, Viewport } from "next";
import { Exo_2, IBM_Plex_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const exo = Exo_2({ subsets: ["latin"], variable: "--font-exo" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "Feel Everything — a DualSense 3D showcase",
  description:
    "An interactive, cinematic 3D study of the PS5 DualSense controller: rotate it, take it apart, try its haptics, and connect your own controller.",
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${exo.variable} ${orbitron.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
