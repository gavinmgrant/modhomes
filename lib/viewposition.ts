import type { HomeConfigQuery } from "./homeconfig";

// The model page reopens in whichever view, outside or inside, was used last
const KEY = "position";

// A link can open a view too, e.g. /homes/mod3x2?floor=concrete&view=inside,
// so a shared home can drop its viewer straight into the walk-through. It's
// not part of the home's configuration (lib/homeconfig.ts), so it never
// reaches the checkout or the price
export const VIEW_PARAM = "view";

// Whether a URL's query asks for the inside view, or undefined when it
// doesn't say or says something else
export const parseView = (query: HomeConfigQuery): boolean | undefined => {
  const value = query[VIEW_PARAM];
  const param = Array.isArray(value) ? value[0] : value;
  if (param === "inside") return true;
  if (param === "outside") return false;
  return undefined;
};

// e.g. "view=inside"
export const toViewParam = (inside: boolean) =>
  `${VIEW_PARAM}=${inside ? "inside" : "outside"}`;

// The view to open: the URL's, if it names one, over the one used last
export const loadInsideView = (query: HomeConfigQuery = {}) =>
  parseView(query) ?? window.localStorage.getItem(KEY) === "inside";

export const saveInsideView = (inside: boolean) =>
  window.localStorage.setItem(KEY, inside ? "inside" : "outside");
