import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SubscriptionGuard from '../components/SubscriptionGuard';
import AppToaster from '../components/AppToaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bisonstechs - Business Suite',
  description: 'Bisonstechs warehouse, sales, purchases, POS and accounting management',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <SubscriptionGuard>{children}</SubscriptionGuard>
        <AppToaster />
      </body>
    </html>
  );
}