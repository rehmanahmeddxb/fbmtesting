import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from 'next/font/google';
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FBM Tools Manager",
  description: "Tool Rental Management System for FBM",
  icons: {
    icon: "/logo.png",
  },
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
})


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
          "font-body antialiased min-h-screen bg-background flex flex-col",
          inter.variable,
          sourceCodePro.variable
        )}>
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
