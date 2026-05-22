import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { BannedGuard } from "@/components/BannedGuard";
import { StealthProvider } from "@/components/StealthProvider";
import { FirebaseErrorGuard } from "@/components/FirebaseErrorGuard";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rainbow Chat",
  description: "Anonymous group chats for everyone",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="rainbow-bg" />
        <AuthProvider>
          <FirebaseErrorGuard>
            <StealthProvider>
              <BannedGuard>{children}</BannedGuard>
            </StealthProvider>
          </FirebaseErrorGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
