// The model page reopens in whichever view, outside or inside, was used last
const KEY = "position";

export const loadInsideView = () =>
  window.localStorage.getItem(KEY) === "inside";

export const saveInsideView = (inside: boolean) =>
  window.localStorage.setItem(KEY, inside ? "inside" : "outside");
