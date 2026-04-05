import "./globals.css";
import iramLogo from "../assets/iram.PNG";

export const metadata = {
  title: "IRAM",
  description: "Санаторий / отель",
  manifest: "/manifest.webmanifest",
  applicationName: "IRAM",
  icons: {
    icon: iramLogo.src,
    shortcut: iramLogo.src,
    apple: iramLogo.src,
  },
  appleWebApp: {
    capable: true,
    title: "IRAM",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#0f5f8f",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="font-sans">{children}</body>
    </html>
  );
}
