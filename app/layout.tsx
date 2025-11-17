import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UV Coated Club Flyers',
  description: 'Create and order custom UV coated club flyers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head></head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
