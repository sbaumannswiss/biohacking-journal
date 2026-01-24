import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { clsx } from 'clsx';
import { HelixProvider } from '@/components/coach';
import { DisclaimerOverlay } from '@/components/ui/DisclaimerOverlay';
import { FloatingChat } from '@/components/agent/FloatingChat';
import { I18nProvider } from '@/components/i18n';
import { AuthProvider } from '@/components/auth';
import { CookieBanner } from '@/components/consent';
import { AppTourProvider, TourOverlay } from '@/components/tour';
import { ThemeProvider } from '@/components/theme';

// Plus Jakarta Sans - Premium, modern, cleaner Look
const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: '--font-plus-jakarta'
});

export const metadata: Metadata = {
  title: "STAX",
  description: "Advanced Supplement & Performance Tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={clsx(
        plusJakarta.className, 
        "bg-background text-foreground min-h-screen selection:bg-primary selection:text-primary-foreground"
      )}>
        <ThemeProvider>
          <AuthProvider>
          <I18nProvider>
            <HelixProvider>
              <AppTourProvider>
                <DisclaimerOverlay />
                <div className="relative flex min-h-screen flex-col overflow-hidden sm:mx-auto sm:max-w-md sm:border-x sm:border-border">
                  {/* Background Ambient Glows */}
                  <div className="fixed top-[-10%] left-[-10%] h-[50vh] w-[50vh] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
                  <div className="fixed bottom-[-10%] right-[-10%] h-[50vh] w-[50vh] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

                  <main className="flex-1 flex flex-col relative z-10 pb-safe">
                    {children}
                  </main>
                </div>
                <FloatingChat />
                <CookieBanner />
                <TourOverlay />
              </AppTourProvider>
            </HelixProvider>
          </I18nProvider>
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
