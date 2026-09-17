/**
 * Resultado padrão das server actions.
 *
 * Mora fora dos arquivos "use server" de propósito: naqueles arquivos todo
 * export precisa ser uma função async, então um `export type` ali é frágil.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; conflictClientId?: string };

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string, conflictClientId?: string): ActionResult<never> {
  return { ok: false, error, conflictClientId };
}
