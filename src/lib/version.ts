// Single source of truth for VISION version
export const APP_VERSION = "1.1.1";
export const APP_BUILD = "2026-08-29";
export const APP_NAME = "VISION";

export type VersionInfo = {
  version: string;
  build: string;
  name?: string;
};

export async function fetchLatestVersion(): Promise<VersionInfo | null> {
  try {
    const res = await fetch("/version.json", { cache: "no-store" });
    if (!res.ok) return null;
    const j = await res.json();
    if (!j.version) return null;
    return { version: String(j.version), build: String(j.build || ""), name: j.name };
  } catch {
    return null;
  }
}

export function isNewerVersion(latest: string, current: string): boolean {
  const a = latest.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}
