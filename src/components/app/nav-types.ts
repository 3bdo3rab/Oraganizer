import type { ViewKey } from "./app-shell";

export type NavFn = (
  view: ViewKey,
  opts?: { clientId?: string; projectId?: string }
) => void;
