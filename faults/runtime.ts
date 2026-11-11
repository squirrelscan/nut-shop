import active from "./active.json";
import { FAULT_IDS, type FaultId } from "./registry";

let override: ReadonlySet<string> | null = null;

/** Fault ids currently ON (active.json, bundled at build time). */
export function activeFaults(): ReadonlySet<string> {
  return override ?? new Set(active as string[]);
}

export const fault = (id: FaultId): boolean => activeFaults().has(id);

/** Test helper: run `fn` with exactly these faults on. */
export function withFaults<T>(ids: readonly FaultId[], fn: () => T): T {
  const prev = override;
  override = new Set(ids);
  try {
    return fn();
  } finally {
    override = prev;
  }
}

export async function withFaultsAsync<T>(
  ids: readonly FaultId[],
  fn: () => Promise<T>,
): Promise<T> {
  const prev = override;
  override = new Set(ids);
  try {
    return await fn();
  } finally {
    override = prev;
  }
}

export const isKnownFault = (id: string): id is FaultId =>
  (FAULT_IDS as readonly string[]).includes(id);
