import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clipscale-kappa.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {default:"ClipScale — SaaS pour agences de clipping",template:"%s · ClipScale"},
  description: "Centralisez la création, la validation, la diffusion et l’analyse de clips courts pour vos clients.",
  keywords:["agence de clipping","logiciel clipping","SaaS clipping","clips TikTok","YouTube Shorts","Instagram Reels"],
  openGraph:{title:"ClipScale — Le cockpit des agences de clipping",description:"Du format long à une campagne de clips pilotée dans un seul espace.",type:"website",locale:"fr_FR"},
  robots:{index:true,follow:true},
  other: {
    "codex-preview": "development",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
