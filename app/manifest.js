import iramLogo from "../assets/iram.PNG";

export default function manifest() {
  return {
    id: "/",
    name: "IRAM",
    short_name: "IRAM",
    description: "Санаторий / отель",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f2f2f7",
    theme_color: "#0f5f8f",
    lang: "ru",
    categories: ["business", "productivity", "travel"],
    icons: [
      {
        src: iramLogo.src,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
