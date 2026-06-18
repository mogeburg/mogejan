function normalizePathname(pathname: string): string {
  const cleaned = pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
  return cleaned || "/";
}

export function getStorageScope(): string {
  if (typeof window === "undefined") return "server";
  const path = normalizePathname(window.location.pathname);
  return path.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "root";
}

export function createStorageKey(namespace: string): string {
  return `mogejan-${namespace}-${getStorageScope()}`;
}
