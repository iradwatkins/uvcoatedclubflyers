import './globals.css';
import type { Metadata } from 'next';
import { CartProvider } from '@/components/cart/cart-provider';
import { ChatwootWidget } from '@/components/chatwoot/chatwoot-widget';

export const metadata: Metadata = {
  title: 'UV Coated Club Flyers',
  description: 'Create and order custom UV coated club flyers',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head></head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <CartProvider>{children}</CartProvider>
        <ChatwootWidget />
      </body>
    </html>
  );
}
