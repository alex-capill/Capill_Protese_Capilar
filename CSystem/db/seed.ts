import { randomUUID } from "node:crypto";
import { db } from "./index";
import { labels, lists, taskColumns } from "./schema";
import { SEED_LABELS, SEED_LISTS, SEED_TASK_COLUMNS } from "./seed-data";

/**
 * Cria a estrutura inicial: 12 listas, 15 etiquetas, 4 colunas de tarefa.
 * ZERO clientes — a base começa vazia, por decisão.
 *
 * É idempotente: rodar de novo não duplica nada nem sobrescreve o que o Alex
 * já editou. Só insere o que estiver faltando.
 */

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const existingLists = db.select().from(lists).all();
  const existingListNames = new Set(existingLists.map((l) => l.name));

  let inserted = 0;
  SEED_LISTS.forEach((seed, index) => {
    if (existingListNames.has(seed.name)) return;
    db.insert(lists)
      .values({
        id: randomUUID(),
        name: seed.name,
        slug: slugify(seed.name),
        position: (index + 1) * 1000,
        kind: seed.kind,
        color: seed.color,
        defaultKeyword: seed.defaultKeyword,
        keywordChoices: seed.keywordChoices
          ? JSON.stringify(seed.keywordChoices)
          : null,
        countsAsStage: seed.countsAsStage,
      })
      .run();
    inserted += 1;
  });
  console.log(`listas: ${inserted} criadas, ${existingLists.length} já existiam`);

  const existingLabels = db.select().from(labels).all();
  const existingLabelNames = new Set(existingLabels.map((l) => l.name));

  let labelsInserted = 0;
  SEED_LABELS.forEach((seed, index) => {
    if (existingLabelNames.has(seed.name)) return;
    db.insert(labels)
      .values({
        id: randomUUID(),
        name: seed.name,
        group: seed.group,
        colorHex: seed.colorHex,
        position: (index + 1) * 1000,
        scope: "both",
      })
      .run();
    labelsInserted += 1;
  });
  console.log(
    `etiquetas: ${labelsInserted} criadas, ${existingLabels.length} já existiam`,
  );

  const existingColumns = db.select().from(taskColumns).all();
  const existingColumnNames = new Set(existingColumns.map((c) => c.name));

  let columnsInserted = 0;
  SEED_TASK_COLUMNS.forEach((seed, index) => {
    if (existingColumnNames.has(seed.name)) return;
    db.insert(taskColumns)
      .values({
        id: randomUUID(),
        name: seed.name,
        position: (index + 1) * 1000,
        accent: seed.accent,
      })
      .run();
    columnsInserted += 1;
  });
  console.log(
    `colunas de tarefa: ${columnsInserted} criadas, ${existingColumns.length} já existiam`,
  );

  console.log("\nPronto. Nenhum cliente foi criado — a base começa vazia.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
