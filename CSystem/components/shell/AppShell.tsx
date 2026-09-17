import { MobileNav, Rail } from "./Rail";

/**
 * Moldura de todas as telas: rail à esquerda, conteúdo à direita.
 *
 * O conteúdo tem largura máxima generosa (1600px) porque o Kanban do funil
 * precisa de espaço horizontal — a referência também é uma tela larga.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Rail />
      <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8 lg:pl-0 lg:pr-8">
        <div className="mx-auto w-full max-w-[1600px]">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
