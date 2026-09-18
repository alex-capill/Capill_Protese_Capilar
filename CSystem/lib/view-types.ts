import type { Keyword, Stage } from "./keywords";

/**
 * DTOs que atravessam a fronteira servidor → cliente.
 *
 * Datas viajam como string ISO porque Server Components serializam para o
 * cliente: um `Date` vira string no caminho de qualquer jeito, e tipar como
 * string evita a surpresa de chamar `.getTime()` em cima de um texto.
 */

export type LabelView = {
  id: string;
  name: string;
  group: string;
  colorHex: string;
};

export type ListView = {
  id: string;
  name: string;
  color: string | null;
  kind: string;
  position: number;
  defaultKeyword: Keyword | null;
  keywordChoices: Keyword[];
  countsAsStage: Stage | null;
};

export type ClientView = {
  id: string;
  name: string;
  listId: string;
  position: number;
  phoneNormalized: string | null;
  city: string | null;
  modality: string | null;
  status: string;
  sdrClassification: string | null;
  sdrConfidence: string | null;
  valueCents: number | null;
  evaluationAt: string | null;
  nextFollowupAt: string | null;
  createdAt: string;
  labels: LabelView[];
  lastEvent: { keyword: string | null; body: string; createdAt: string } | null;
};

export type EventView = {
  id: string;
  /** Preenchido quando o comentário nasceu de um arrasto. Pareia os dois na linha do tempo. */
  transitionId: string | null;
  keyword: string | null;
  body: string;
  reason: string | null;
  followupMotivo: string | null;
  followupEvento: string | null;
  followupData: string | null;
  author: string;
  createdAt: string;
};

export type TransitionView = {
  id: string;
  fromListName: string | null;
  toListName: string;
  keyword: string | null;
  source: string;
  movedAt: string;
};

export type TaskColumnView = {
  id: string;
  name: string;
  accent: string | null;
  position: number;
};

export type TaskView = {
  id: string;
  title: string;
  notes: string | null;
  columnId: string;
  position: number;
  dueAt: string | null;
  priority: string;
  doneAt: string | null;
  clientId: string | null;
  clientName: string | null;
  labels: LabelView[];
};

export type AppointmentView = {
  id: string;
  title: string;
  clientId: string | null;
  clientName: string | null;
  startsAt: string;
  endsAt: string | null;
  kind: string;
  modality: string | null;
  status: string;
};
