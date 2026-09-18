"use client";

import { useState, useTransition } from "react";
import { updateListAction } from "@/app/actions/lists";
import { ALL_STAGES, KEYWORDS, STAGE_LABEL, type Stage } from "@/lib/keywords";
import type { ListView } from "@/lib/view-types";

/**
 * Configuração das listas: o que cada uma significa para a métrica e qual
 * palavra-chave ela sugere.
 *
 * Esta tela é o motivo de o mapa lista → palavra-chave ser configuração e não
 * código: o Alex cria e renomeia listas, e um mapa fixo quebraria na primeira.
 */
export function ListsManager({ lists }: { lists: ListView[] }) {
  return (
    <section className="card p-7">
      <h2 className="mb-1 text-xl font-bold tracking-tight">Listas do funil</h2>
      <p className="mb-5 text-sm text-muted">
        <strong className="text-text">Conta como</strong> é o que o dashboard soma. Duas
        listas podem apontar para a mesma etapa — é o caso de AGUARDANDO CONTRATO e FAZER
        PEDIDO DO SISTEMA, que ambas significam &quot;fechou&quot;.
      </p>

      <div className="thin-scroll overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-semibold">Lista</th>
              <th className="pb-2 font-semibold">Conta como</th>
              <th className="pb-2 font-semibold">Sugere a palavra-chave</th>
            </tr>
          </thead>
          <tbody>
            {lists.map((list) => (
              <ListRow key={list.id} list={list} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ListRow({ list }: { list: ListView }) {
  const [stage, setStage] = useState<string>(list.countsAsStage ?? "");
  const [keyword, setKeyword] = useState<string>(list.defaultKeyword ?? "");
  const [saved, setSaved] = useState(false);
  const [, startTransition] = useTransition();

  function persist(patch: { countsAsStage?: string | null; defaultKeyword?: string | null }) {
    startTransition(async () => {
      await updateListAction(list.id, patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="py-2.5 pr-4">
        <span className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: list.color ?? "var(--muted)" }}
          />
          <span className="font-medium">{list.name}</span>
          {saved && <span className="text-[11px] font-semibold text-positive">salvo</span>}
        </span>
      </td>

      <td className="py-2.5 pr-4">
        <select
          value={stage}
          onChange={(event) => {
            setStage(event.target.value);
            persist({ countsAsStage: event.target.value || null });
          }}
          className="field py-1.5 text-xs"
        >
          <option value="">Não conta</option>
          {ALL_STAGES.map((option) => (
            <option key={option} value={option}>
              {STAGE_LABEL[option as Stage]}
            </option>
          ))}
        </select>
      </td>

      <td className="py-2.5">
        <select
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            persist({ defaultKeyword: event.target.value || null });
          }}
          className="field py-1.5 text-xs"
        >
          <option value="">Nenhuma</option>
          {KEYWORDS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}
