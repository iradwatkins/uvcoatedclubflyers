export const metadata = {
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
      <body>{children}</body>
    </html>
  );
}
