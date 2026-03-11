import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Qist Market Management System",
  description:
    "Next.js admin dashboard toolkit with 200+ templates, UI components, and integrations for fast dashboard development.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
          <Providers>
          <NextTopLoader color="#ff3d3d" showSpinner={false} />
          {children}
          <Toaster />
          </Providers>
      </body>
    </html>
  );
}