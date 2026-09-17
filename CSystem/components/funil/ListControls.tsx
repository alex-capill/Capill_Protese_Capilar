"use client";

import { useState, useTransition } from "react";
import {
  archiveListAction,
  createListAction,
  deleteListAction,
  updateListAction,
} from "@/app/actions/lists";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Dialog } from "@/components/ui/Dialog";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { IconGrip, IconPencil, IconPlus, IconTrash } from "@/components/ui/icons";
import { ALL_STAGES, KEYWORDS, STAGE_LABEL, type Stage } from "@/lib/keywords";
import type { ListView } from "@/lib/view-types";

/* ------------------------------------------------------------- nova lista */

export function AddListButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#64748B");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await createListAction({ name, color });
      if (result.ok) {
        setOpen(false);
        setName("");
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-[240px] shrink-0 items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--border-strong)] py-5 text-sm font-semibold text-muted transition hover:border-accent hover:text-text"
      >
        <IconPlus size={16} />
        Nova lista
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nova lista"
        description="Uma etapa nova no funil. Você define depois o que ela significa para a métrica."
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="chip chip-off">
              Cancelar
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending || !name.trim()}
              className="btn-ink px-4 py-2 text-sm disabled:opacity-50"
            >
              {pending ? "Criando…" : "Criar lista"}
            </button>
          </>
        }
      >
        <div className="space-y-4 pb-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Nome</span>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: AGUARDANDO RETORNO"
              className="field"
            />
          </label>
          <ColorPicker value={color} onChange={setColor} label="Cor da coluna" />
          {error && <p className="text-sm text-negative">{error}</p>}
        </div>
      </Dialog>
    </>
  );
}

/* ---------------------------------------------------------- menu da coluna */

export function ColumnMenu({
  list,
  allLists,
  cardCount,
}: {
  list: ListView;
  allLists: ListView[];
  cardCount: number;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <>
      <Menu
        trigger={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            aria-label={`Opções da lista ${list.name}`}
            className="icon-btn size-7 bg-transparent shadow-none"
          >
            <IconGrip size={14} />
          </button>
        )}
      >
        {({ close }) => (
          <>
            <MenuItem
              onClick={() => {
                close();
                setSettingsOpen(true);
              }}
            >
              <IconPencil size={15} />
              Editar lista
            </MenuItem>
            <MenuSeparator />
            {/* Arquivar esconde a coluna. Com cards dentro, eles sumiriam da tela
                sem terem ido a lugar nenhum — então só permitimos com a lista vazia. */}
            <MenuItem
              disabled={cardCount > 0}
              onClick={() => {
                close();
                startTransition(() => void archiveListAction(list.id, true));
              }}
            >
              {cardCount > 0 ? "Arquivar (esvazie antes)" : "Arquivar"}
            </MenuItem>
            <MenuItem
              danger
              onClick={() => {
                close();
                setDeleteOpen(true);
              }}
            >
              <IconTrash size={15} />
              Excluir
            </MenuItem>
          </>
        )}
      </Menu>

      {settingsOpen && (
        <ListSettingsDialog list={list} onClose={() => setSettingsOpen(false)} />
      )}
      {deleteOpen && (
        <DeleteListDialog
          list={list}
          allLists={allLists}
          cardCount={cardCount}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------- editar uma lista */

function ListSettingsDialog({ list, onClose }: { list: ListView; onClose: () => void }) {
  const [name, setName] = useState(list.name);
  const [color, setColor] = useState(list.color ?? "#64748B");
  const [keyword, setKeyword] = useState(list.defaultKeyword ?? "");
  const [stage, setStage] = useState<string>(list.countsAsStage ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateListAction(list.id, {
        name,
        color,
        defaultKeyword: keyword || null,
        countsAsStage: stage || null,
      });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Editar lista"
      width={560}
      footer={
        <>
          <button type="button" onClick={onClose} className="chip chip-off">
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="btn-ink px-4 py-2 text-sm disabled:opacity-50"
          >
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </>
      }
    >
      <div className="space-y-5 pb-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Nome</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field"
          />
        </label>

        <ColorPicker value={color} onChange={setColor} label="Cor da coluna" />

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">
            Palavra-chave sugerida ao soltar um card aqui
          </span>
          <select
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="field"
          >
            <option value="">Nenhuma — não perguntar nada</option>
            {KEYWORDS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">
            É só uma sugestão de comentário. A métrica é gravada de qualquer jeito.
          </span>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Conta como etapa do funil</span>
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            className="field"
          >
            <option value="">Não entra na contagem do funil</option>
            {ALL_STAGES.map((option) => (
              <option key={option} value={option}>
                {STAGE_LABEL[option as Stage]}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">
            Isto é o que o dashboard soma. Duas listas podem apontar para a mesma etapa —
            é o caso de AGUARDANDO CONTRATO e FAZER PEDIDO DO SISTEMA, que ambas
            significam &quot;fechou&quot;.
          </span>
        </label>

        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------- excluir uma lista */

function DeleteListDialog({
  list,
  allLists,
  cardCount,
  onClose,
}: {
  list: ListView;
  allLists: ListView[];
  cardCount: number;
  onClose: () => void;
}) {
  const others = allLists.filter((item) => item.id !== list.id);
  const [destination, setDestination] = useState(others[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await deleteListAction({
        listId: list.id,
        moveCardsToListId: cardCount > 0 ? destination : null,
      });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Excluir "${list.name}"`}
      description="O histórico de métrica desta lista é preservado: os meses anteriores continuam com os números certos."
      footer={
        <>
          <button type="button" onClick={onClose} className="chip chip-off">
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={pending || (cardCount > 0 && !destination)}
            className="rounded-full bg-negative px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Excluindo…" : "Excluir lista"}
          </button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        {cardCount > 0 ? (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">
              Esta lista tem {cardCount} card{cardCount > 1 ? "s" : ""}. Mover para:
            </span>
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="field"
            >
              {others.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-muted">A lista está vazia. Nada será movido.</p>
        )}
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>
    </Dialog>
  );
}
