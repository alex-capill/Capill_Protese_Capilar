import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CSystem — Capill",
  description: "CRM operacional da Capill: funil, tarefas e métricas.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E8E9E8" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0C0B" },
  ],
};

/**
 * Aplica o tema salvo ANTES da primeira pintura.
 *
 * Sem isto a tela pisca branco por um frame ao carregar no escuro. Precisa ser
 * síncrono e inline no <head>, por isso não dá para virar um componente React.
 */
const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem('csystem-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={urbanist.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
