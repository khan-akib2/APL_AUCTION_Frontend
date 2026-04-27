import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/Toast";

export const metadata = {
  title: "APL Sports Auction",
  description: "Alliance Premiere League Sports Auction Platform",
  robots: { index: true, follow: true },
  icons: {
    icon: '/APL.png',
    shortcut: '/APL.png',
    apple: '/APL.png',
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a1628",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#0a1628] text-white antialiased" suppressHydrationWarning>
        <div className="relative z-10 min-h-full">
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
