import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

/**
 * Apaga o banco local. Destrutivo e sem volta — por isso pede confirmação
 * digitada, mesmo rodando via npm script.
 */

const DB_PATH = process.env.CSYSTEM_DB_PATH ?? "./data/csystem.db";
const absolute = path.resolve(process.cwd(), DB_PATH);

async function main() {
  if (!fs.existsSync(absolute)) {
    console.log(`Nada a fazer: ${absolute} não existe.`);
    return;
  }

  const stats = fs.statSync(absolute);
  console.log(`Banco: ${absolute}`);
  console.log(`Tamanho: ${(stats.size / 1024).toFixed(0)} KB`);
  console.log(`Modificado: ${stats.mtime.toLocaleString("pt-BR")}`);
  console.log(
    "\nIsto APAGA todos os clientes, eventos, métricas e tarefas. Não há desfazer.",
  );

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Digite "APAGAR" para confirmar: ');
  rl.close();

  if (answer.trim() !== "APAGAR") {
    console.log("Cancelado. Nada foi apagado.");
    return;
  }

  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    const file = `${absolute}${suffix}`;
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  console.log("Banco apagado. Rode `npm run db:push && npm run db:seed` para recriar.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
