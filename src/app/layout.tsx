import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from 'next/font/google';
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FBM Tools Manager",
  description: "Tool Rental Management System for FBM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", "min-h-screen bg-background flex flex-col")}>
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
