import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import SWRegister from '@/components/SWRegister';
import UpdateBanner from '@/components/UpdateBanner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vision.example.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'VISION — Your Personal AI Assistant',
    template: '%s | VISION',
  },
  description: 'VISION is a fast, intelligent personal AI assistant for chat, coding, image analysis, and more.',
  applicationName: 'VISION',
  keywords: ['AI assistant', 'VISION', 'chat', 'code', 'image analysis', 'local AI', 'Ollama'],
  authors: [{ name: 'VISION' }],
  creator: 'VISION',
  publisher: 'VISION',
  alternates: { canonical: '/' },
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.png'],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'VISION — Your Personal AI Assistant',
    description: 'VISION is a fast, intelligent personal AI assistant for chat, coding, image analysis, and more.',
    siteName: 'VISION',
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'VISION logo' }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VISION — Your Personal AI Assistant',
    description: 'VISION is a fast, intelligent personal AI assistant for chat, coding, image analysis, and more.',
    images: ['/icons/icon-512.png'],
  },
  appleWebApp: {
    capable: true,
    title: 'VISION',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
  category: 'productivity',
  verification: {},
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "VISION",
    "description": "VISION is a fast, intelligent personal AI assistant for chat, coding, image analysis, and more.",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web, Android, iOS, Windows, macOS",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "url": siteUrl,
  };
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icons/icon-32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="VISION" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`${inter.variable} ${mono.variable} antialiased app-root`} style={{ height: "100dvh", overflow: "hidden", background: "var(--bg)", color: "var(--text)" }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vision-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var m=t||(d?'dark':'light');if(m==='dark')document.documentElement.classList.add('dark');else{document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}try{var s=JSON.parse(localStorage.getItem('vision_app_settings')||'{}');if(s.theme){var tm=s.theme==='system'?(d?'dark':'light'):s.theme;document.documentElement.classList.toggle('dark',tm==='dark');document.documentElement.classList.toggle('light',tm==='light');}if(s.font_size){document.documentElement.style.setProperty('--vision-font-scale',s.font_size==='small'?'0.9':s.font_size==='large'?'1.08':'1');}if(s.chat_density)document.documentElement.dataset.density=s.chat_density;}catch(e){}}catch(e){}})();`,
          }}
        />
        <SWRegister />
        <AuthProvider><WebSocketProvider>{children}<UpdateBanner /></WebSocketProvider></AuthProvider>
      </body>
    </html>
  );
}
