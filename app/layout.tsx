import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "海产鲜行",
  description: "高端海产生鲜商城与冷链供应链服务平台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
