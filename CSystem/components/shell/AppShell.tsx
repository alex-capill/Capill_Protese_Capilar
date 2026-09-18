import { MobileNav, Rail } from "./Rail";
import { WorkspacePanelsProvider } from "@/components/workspace/WorkspacePanelsContext";

/**
 * Moldura de todas as telas: rail à esquerda, conteúdo à direita.
 *
 * O conteúdo tem largura máxima generosa (1600px) porque o Kanban do funil
 * precisa de espaço horizontal — a referência também é uma tela larga.
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
        <main className="min-w-0 flex-1 px-4 pb-24 pt-7 sm:px-6 md:px-8 md:pb-10">
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
        <MobileNav />
      </div>
    </WorkspacePanelsProvider>
  );
}
