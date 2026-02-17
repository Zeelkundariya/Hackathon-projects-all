import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Contract Risk Scanner | Professional Legal Analysis',
  description: 'Real-time legal contract analysis powered by advanced AI. Detect risks, analyze clauses, and generate comprehensive reports instantly.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900`}>
        {children}
        {/* PDF.js CDN with reliable Next.js Script strategy */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"
          strategy="beforeInteractive"
        />
        <Script id="pdfjs-init" strategy="beforeInteractive">
          {`window['pdfjs-dist/build/pdf'] = window['pdfjsLib'];`}
        </Script>
      </body>
    </html>
  );
}