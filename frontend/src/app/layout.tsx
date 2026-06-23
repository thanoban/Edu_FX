import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ReactNode } from "react";

import { AuthProvider } from "@/components/auth-provider";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "EduFX",
  description: "Adaptive chemistry study demo with webcam behaviour tracking"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={plusJakartaSans.variable}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
