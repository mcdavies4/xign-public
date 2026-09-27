import type { Metadata } from 'next';
import './globals.css';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Xign — Collect a signature',
  description: 'Send a link. They draw their signature. You get the image back — no document, no account needed for them.',
  openGraph: {
    title: 'Xign — Collect a signature',
    description: 'Send a link. They draw their signature. You get the image back — no document, no account needed for them.',
    siteName: 'Xign',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xign — Collect a signature',
    description: 'Send a link. They draw their signature. You get the image back — no document, no account needed for them.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, overflowX: 'hidden' }}>{children}</body>
    </html>
  );
}
