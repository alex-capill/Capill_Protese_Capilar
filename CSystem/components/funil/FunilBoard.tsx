"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { moveClientAction } from "@/app/actions/clients";
import type { ClientView, ListView } from "@/lib/view-types";
import type { Keyword } from "@/lib/keywords";
import { ClientMiniCard } from "./ClientMiniCard";
import { FunilColumn } from "./FunilColumn";
import { TransitionPrompt, type PromptState } from "./TransitionPrompt";
import { UndoToast } from "./UndoToast";
import { AddListButton } from "./ListControls";
import { FadeScroller } from "@/components/ui/FadeScroller";

/**
 * O Kanban do funil.
 *
 * Aqui acontece a coisa mais importante do sistema: soltar um card numa lista
 * grava a métrica. O servidor registra a transição SEMPRE; o balão que aparece
 * depois é só o registro qualitativo, e ignorá-lo não perde nenhum número.
 */

type Props = {
  lists: ListView[];
  clients: ClientView[];
};

export function FunilBoard({ lists, clients }: Props) {
  const [items, setItems] = useState<Record<string, string[]>>(() => groupByList(lists, clients));
  const [cards, setCards] = useState<Record<string, ClientView>>(() =>
    Object.fromEntries(clients.map((client) => [client.id, client])),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<PromptState | null>(null);
  const [undo, setUndo] = useState<{ transitionId: string; label: string } | null>(null);
  const [, startTransition] = useTransition();

  // Quando o servidor revalida, as props chegam com a verdade nova. Ajustar o
  // estado durante a renderização (padrão oficial do React para "estado derivado
  // de props") evita o flash de um useEffect com um render intermediário errado.
  const signature = clients.map((c) => `${c.id}:${c.listId}:${c.position}`).join("|");
  const [syncedSignature, setSyncedSignature] = useState(signature);
  if (syncedSignature !== signature) {
    setSyncedSignature(signature);
    setItems(groupByList(lists, clients));
    setCards(Object.fromEntries(clients.map((client) => [client.id, client])));
  }

  const sensors = useSensors(
    // 6px de tolerância: sem isso, um clique para abrir o card vira arrasto.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function findColumn(id: string): string | null {
    if (items[id]) return id;
    return Object.keys(items).find((columnId) => items[columnId].includes(id)) ?? null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  /** Move o card entre colunas enquanto arrasta, só visualmente. */
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeColumn = findColumn(String(active.id));
    const overColumn = findColumn(String(over.id));
    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setItems((current) => {
      const source = current[activeColumn].filter((id) => id !== active.id);
      const target = [...current[overColumn]];
      const overIndex = target.indexOf(String(over.id));
      const insertAt = overIndex >= 0 ? overIndex : target.length;
      target.splice(insertAt, 0, String(active.id));
      return { ...current, [activeColumn]: source, [overColumn]: target };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const clientId = String(active.id);
    const targetColumn = findColumn(String(over.id));
    if (!targetColumn) return;

    const originalList = cards[clientId]?.listId;

    // Reordena dentro da coluna de destino antes de persistir.
    let ordered = items[targetColumn] ?? [];
    const fromIndex = ordered.indexOf(clientId);
    const overIndex = ordered.indexOf(String(over.id));
    if (fromIndex >= 0 && overIndex >= 0 && fromIndex !== overIndex) {
      ordered = [...ordered];
      ordered.splice(fromIndex, 1);
      ordered.splice(overIndex, 0, clientId);
      setItems((current) => ({ ...current, [targetColumn]: ordered }));
    }

    const finalIndex = ordered.indexOf(clientId);
    const beforeId = finalIndex > 0 ? ordered[finalIndex - 1] : null;
    const afterId = finalIndex < ordered.length - 1 ? ordered[finalIndex + 1] : null;

    // Otimista: o card já aparece na coluna nova antes da resposta do servidor.
    setCards((current) => ({
      ...current,
      [clientId]: { ...current[clientId], listId: targetColumn },
    }));

    startTransition(async () => {
      const result = await moveClientAction({
        clientId,
        toListId: targetColumn,
        beforeId,
        afterId,
      });

      if (!result.ok) {
        // Reverte a posição visual: o servidor recusou o movimento.
        setItems(groupByList(lists, clients));
        setCards((current) => ({
          ...current,
          [clientId]: { ...current[clientId], listId: originalList ?? targetColumn },
        }));
        return;
      }

      const move = result.data;
      const changedList = originalList !== targetColumn;
      if (!changedList) return;

      setUndo({
        transitionId: move.transitionId,
        label: `${cards[clientId]?.name ?? "Card"} → ${move.toListName}`,
      });

      const suggestions: Keyword[] =
        move.keywordChoices.length > 0
          ? move.keywordChoices
          : move.suggestedKeyword
            ? [move.suggestedKeyword]
            : [];

      if (suggestions.length > 0 || move.asksForDate) {
        setPrompt({
          transitionId: move.transitionId,
          clientId,
          clientName: cards[clientId]?.name ?? "Cliente",
          toListName: move.toListName,
          suggestions,
          asksForDate: move.asksForDate,
        });
      }
    });
  }

  const activeCard = activeId ? cards[activeId] : null;
  const visibleLists = lists;

  return (
    <>
      <DndContext
        // Id fixo: sem ele o dnd-kit gera um contador próprio no servidor e outro
        // no cliente, e o aria-describedby dos cards diverge na hidratação.
        id="funil-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <FadeScroller className="items-start" fadeWidth={72}>
          {visibleLists.map((list) => {
            const ids = items[list.id] ?? [];
            return (
              <SortableContext
                key={list.id}
                id={list.id}
                items={ids}
                strategy={verticalListSortingStrategy}
              >
                <FunilColumn
                  list={list}
                  allLists={lists}
                  cards={ids.map((id) => cards[id]).filter(Boolean)}
                />
              </SortableContext>
            );
          })}
          <AddListButton />
        </FadeScroller>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(.2,.8,.3,1)" }}>
          {activeCard && <ClientMiniCard client={activeCard} dragging />}
        </DragOverlay>
      </DndContext>

      {prompt && <TransitionPrompt state={prompt} onClose={() => setPrompt(null)} />}
      {undo && <UndoToast undo={undo} onDone={() => setUndo(null)} />}
    </>
  );
}

function groupByList(lists: ListView[], clients: ClientView[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const list of lists) grouped[list.id] = [];
  for (const client of [...clients].sort((a, b) => a.position - b.position)) {
    if (!grouped[client.listId]) grouped[client.listId] = [];
    grouped[client.listId].push(client.id);
  }
  return grouped;
}
