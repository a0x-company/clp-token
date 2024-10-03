// next
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";

// internationalization
import { NextIntlClientProvider } from "next-intl";

// global styles
import "./globals.css";

// coponents
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CLP Token",
  description: "CLP Token",
};

const helvetica = localFont({
  src: [
    {
      path: "../../../public/fonts/Helvetica.ttf",
      weight: "500",
    },
    {
      path: "../../../public/fonts/Helvetica-Bold.ttf",
      weight: "700",
    },
  ],
  variable: "--font-helvetica",
});

const romaben = localFont({
  src: [
    {
      path: "../../../public/fonts/Romaben-Regular.ttf",
      weight: "500",
    },
  ],
  variable: "--font-romaben",
});

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let messages;

  try {
    messages = (await import(`../../../messages/${params.locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <NextIntlClientProvider
      locale={params.locale}
      messages={messages}
      timeZone="America/Santiago"
      now={new Date()}
    >
      <html lang="en">
        <body className={`${helvetica.variable} ${romaben.variable} antialiased`}>{children}</body>
      </html>
    </NextIntlClientProvider>
  );
}
