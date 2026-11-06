import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAMT Nextopia — คุณเหมาะกับสาขาไหนใน CAMT?",
  description: "สร้างตัวละคร ตอบ 6 คำถาม แล้วดูว่าคุณเหมาะกับสาขาไหนในวิทยาลัยศิลปะ สื่อ และเทคโนโลยี มหาวิทยาลัยเชียงใหม่ (CAMT CMU) พร้อมลุ้นของรางวัล",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1030",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;700&family=Orbitron:wght@500;700;900&family=Silkscreen:wght@400;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
