/**
 * The viewer's ephemeral, anonymous nickname (design D4/D11 — no accounts).
 * Captured in the lobby, kept in sessionStorage so it survives the navigation
 * into a room and a reload, and read by presence in Phase 3. Never persisted
 * server-side.
 */

const KEY = "sealion:nickname";

const ANIMALS = [
  "Otter", "Heron", "Marten", "Lynx", "Tapir", "Crane",
  "Gannet", "Shrike", "Vole", "Quokka", "Civet", "Ibis",
];

export function randomNickname(): string {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${animal}-${Math.floor(Math.random() * 100)}`;
}

export function getNickname(): string {
  const stored = sessionStorage.getItem(KEY);
  if (stored) return stored;
  const generated = randomNickname();
  sessionStorage.setItem(KEY, generated);
  return generated;
}

export function setNickname(name: string) {
  const trimmed = name.trim();
  if (trimmed) sessionStorage.setItem(KEY, trimmed);
}
