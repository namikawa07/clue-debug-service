const key = (wid: string) => `finepro:last-space:${wid}`;

export function useLastSpace(workspaceId: string) {
  const get = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key(workspaceId));
    } catch {
      return null;
    }
  };

  const set = (spaceId: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key(workspaceId), spaceId);
    } catch {}
  };

  return { get, set };
}
