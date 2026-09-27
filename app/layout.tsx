import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Xign — Collect a signature',
  description: 'Send a link. They draw their signature. You get the image back — no document, no account needed for them.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
