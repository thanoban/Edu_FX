import type { Metadata } from "next";
import { ReactNode } from "react";

import { AuthProvider } from "@/components/auth-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "EduFX",
  description: "Adaptive chemistry study demo with webcam behaviour tracking"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
