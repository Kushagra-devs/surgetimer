import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'SurgeTimer',
  description: 'Horse show jumping timer operations platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

