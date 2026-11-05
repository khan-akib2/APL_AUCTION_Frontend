import "./globals.css";
import Script from "next/script";
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
  themeColor: "#0d3a24",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-[#f8f6f0] text-[#111827] antialiased" suppressHydrationWarning>
        <Script id="extension-shield" strategy="beforeInteractive">
          {`
            // 1. Intercept and suppress errors originating from browser extensions
            window.addEventListener('error', function(e) {
              if (e.filename && (e.filename.startsWith('chrome-extension://') || e.filename.startsWith('moz-extension://'))) {
                e.stopImmediatePropagation();
                e.preventDefault();
                return true;
              }
            }, true);

            window.addEventListener('unhandledrejection', function(e) {
              var stack = (e.reason && (e.reason.stack || e.reason.message)) || '';
              if (typeof stack === 'string' && (stack.includes('chrome-extension://') || stack.includes('moz-extension://'))) {
                e.stopImmediatePropagation();
                e.preventDefault();
              }
            }, true);

            // 2. Strip Bitdefender bis_skin_checked attribute before React hydrates
            try {
              var observer = new MutationObserver(function(mutations) {
                for (var i = 0; i < mutations.length; i++) {
                  var m = mutations[i];
                  if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                    m.target.removeAttribute('bis_skin_checked');
                  }
                }
              });
              observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['bis_skin_checked'] });
            } catch (_) {}
          `}
        </Script>
        <div className="relative z-10 min-h-full" suppressHydrationWarning>
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
