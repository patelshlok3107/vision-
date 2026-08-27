import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { WebSocketProvider } from '@/providers/WebSocketProvider';
import { AuthProvider } from '@/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'VISION — Intelligence Designed To Evolve',
  description: 'VISION is an intelligent personal AI system. Reason, remember, act — local-first with Ollama.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-dark.svg', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon-light.svg', media: '(prefers-color-scheme: light)' },
    ],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml' }],
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme-aware favicons — SVG with prefers-color-scheme */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/favicon-light.svg" type="image/svg+xml" media="(prefers-color-scheme: light)" />
        <link rel="apple-touch-icon" href="/apple-icon.svg" />
      </head>
      <body className={`${inter.variable} ${mono.variable} antialiased app-root`} style={{ height: "100dvh", overflow: "hidden", background: "var(--bg)", color: "var(--text)" }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vision-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var m=t||(d?'dark':'light');if(m==='dark')document.documentElement.classList.add('dark');else{document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}try{var s=JSON.parse(localStorage.getItem('vision_app_settings')||'{}');if(s.theme){var tm=s.theme==='system'?(d?'dark':'light'):s.theme;document.documentElement.classList.toggle('dark',tm==='dark');document.documentElement.classList.toggle('light',tm==='light');}if(s.font_size){document.documentElement.style.setProperty('--vision-font-scale',s.font_size==='small'?'0.9':s.font_size==='large'?'1.08':'1');}if(s.chat_density)document.documentElement.dataset.density=s.chat_density;}catch(e){}}catch(e){}})();`,
          }}
        />
        <AuthProvider><WebSocketProvider>{children}</WebSocketProvider></AuthProvider>
      </body>
    </html>
  );
}
