import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bondzi — WASSCE & BECE prep",
    short_name: "Bondzi",
    description:
      "AI-powered WASSCE and BECE exam prep for Ghanaian students. Past questions, AI explanations, spaced repetition.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fbf7ec",
    theme_color: "#FFD93D",
    orientation: "portrait",
    lang: "en-GH",
    categories: ["education", "books", "productivity"],
    icons: [
      {
        src: "/brand/icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    prefer_related_applications: false,
  };
}
