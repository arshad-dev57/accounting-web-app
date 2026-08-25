import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SubscriptionGuard from '../components/SubscriptionGuard';
import AppToaster from '../components/AppToaster';
import HostingerNavFix from '../components/HostingerNavFix';
import LogoutHistoryGuard from '../components/LogoutHistoryGuard';
import { CurrencyProvider } from '../lib/currency-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bisonstechs - Business Suite',
  description: 'Bisonstechs warehouse, sales, purchases, POS and accounting management',
  icons: {
    icon: '/app-icon.png',
    apple: '/app-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <HostingerNavFix />
        <LogoutHistoryGuard />
        <CurrencyProvider>
          <SubscriptionGuard>{children}</SubscriptionGuard>
        </CurrencyProvider>
        <AppToaster />
      </body>
    </html>
  );
}