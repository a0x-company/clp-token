// next
import type { Metadata } from "next";

// styles
import localFont from "next/font/local";
import "./globals.css";

// provider
import Providers from "@/provider";

// components
import { Toaster } from "@/components/ui/toaster";

// cookies
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

// hooks
import { UserInitializer } from "@/hooks/useUserInitializer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CLP Token",
  description: "CLP Token",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookie = cookies().get("session")?.value;
  const session = cookie ? await decrypt(cookie) : null;
  const sessionData = session ? JSON.parse(JSON.stringify(session)) : null;
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <UserInitializer userData={sessionData} />
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
