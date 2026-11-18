import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KK Pharmacy 3D Design 9x15ft',
  description:
    'Interactive 3D pharmacy interior: 9 ft × 12 ft room with cosmetics shelving, L-shaped dispensing counter, medicine racks, walkthrough and floor plan.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7fa27a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
