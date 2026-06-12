import { ReactNode } from "react";
import "@/app/globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { ToastProvider } from "@/components/Toast";

export const metadata = {
  title: "Employee Management System",
  description: "Enterprise level human resource tracking dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="h-full font-sans antialiased">
        <SessionProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
