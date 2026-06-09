import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fiebre Mundialista '26",
  description: "Quiniela del Mundial 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
