import { MobileNav, Rail } from "./Rail";
import { WorkspacePanelsProvider } from "@/components/workspace/WorkspacePanelsContext";

/**
 * Moldura de todas as telas: rail à esquerda, conteúdo à direita.
 *
 * Sem limite de largura próprio: cada página decide (a maioria envolve o
 * próprio conteúdo num `mx-auto max-w-[1320px]`; o Workspace não, porque
 * pediu tela cheia). Um limite aqui no `AppShell` capava a largura de TODAS
 * as páginas, inclusive o Workspace, escondendo o efeito "widescreen" — só
 * não aparecia porque os testes desta sessão usaram uma janela do tamanho
 * exato do limite (1320px), onde o limite nunca chega a apertar.
 *
 * O padding horizontal é assimétrico a partir de `md` (quando o rail aparece)
 * de propósito: a alça do rail já tem 12px de respiro próprio até a borda
 * dele, então `pl-5` (20px) + esses 12px fecham os mesmos 32px de `pr-8` do
 * lado direito — o respiro visual fica igual dos dois lados em vez de o
 * esquerdo parecer maior.
 *
 * `WorkspacePanelsProvider` fica aqui, acima de `Rail` e do conteúdo, porque
 * os dois botões de mostrar/ocultar do Workspace moram no rail, mas os
 * painéis que eles controlam moram na página — precisam de um estado comum.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspacePanelsProvider>
      <div className="flex min-h-dvh">
        <Rail />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-7 sm:px-6 md:pb-10 md:pl-5 md:pr-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </WorkspacePanelsProvider>
  );
}
