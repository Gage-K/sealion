import { useSyncExternalStore } from "react";

/**
 * Minimal hand-rolled routing — no router dependency for the two routes we
 * have (lobby and `/room/:code`). `navigate` pushes a history entry and
 * notifies subscribers; `usePathname` re-renders on both `navigate` and the
 * browser's back/forward (popstate).
 */

const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function navigate(path: string) {
  if (path === window.location.pathname) return;
  window.history.pushState({}, "", path);
  notify();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}

function getSnapshot() {
  return window.location.pathname;
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => "/");
}
