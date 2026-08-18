import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClipScale — Cockpit de contenu",
    short_name: "ClipScale",
    description: "Analysez, adaptez et diffusez vos clips depuis un seul espace.",
    start_url: "/",
    display: "standalone",
    background_color: "#090b12",
    theme_color: "#7658e4",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
