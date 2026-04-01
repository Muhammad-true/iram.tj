import "./globals.css";

export const metadata = {
  title: "Бронирование номеров",
  description: "Санаторий / отель",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="font-sans">{children}</body>
    </html>
  );
}
