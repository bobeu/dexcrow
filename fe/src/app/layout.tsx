import type { Metadata } from 'next';
import './globals.css';
import Providers from "../contexts/Providers";
import ErrorBoundary from '@/components/errors/ErrorBoundary';

export const metadata: Metadata = {
  title: 'TradeVerse',
  description: 'Secure peer-to-peer transactions with smart contract escrow, multi-chain support, and decentralized arbitration',
  keywords: ['escrow', 'blockchain', 'smart contracts', 'decentralized', 'crypto', 'ethereum'],
  authors: [{ name: 'Bobeu' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Decentralized Escrow System',
    description: 'Secure peer-to-peer transactions with smart contract escrow',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decentralized Escrow System',
    description: 'Secure peer-to-peer transactions with smart contract escrow',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ErrorBoundary>
          <Providers>
            <div id="root">
              {children}
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
