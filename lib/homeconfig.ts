import {
  METAL_OPTIONS,
  TRIM_OPTIONS,
  WOOD_OPTIONS,
} from "../components/colors";
import { FLOOR_OPTIONS, TILE_OPTIONS } from "../components/materials";
import { DeckSide, Decks, isDeckUp } from "../components/deck";
import { DEFAULT_FINISHES, Finishes } from "./viewerstate";

// A configured home, as its URL's query carries it, so the model page and
// the checkout show the same home, and a link to it can be shared:
// /homes/mod3x2?metal=copper&floor=concrete&decks=left,right. Each finish is
// its swatch's name in lowercase with dashes, and only what differs from the
// dock's defaults is written. What's being looked at, inside or outside, the
// site or the spec dots, isn't part of the home, so it stays out

type FinishOptions = {
  [K in keyof Finishes]: readonly { name: string; value: Finishes[K] }[];
};

const FINISH_OPTIONS: FinishOptions = {
  metal: METAL_OPTIONS,
  trim: TRIM_OPTIONS,
  wood: WOOD_OPTIONS,
  floor: FLOOR_OPTIONS,
  tile: TILE_OPTIONS,
};

const FINISH_KEYS = Object.keys(FINISH_OPTIONS) as (keyof Finishes)[];

// The decks by the side of the home they're on, -x and +x
const DECK_PARAMS: [DeckSide, string][] = [
  [-1, "left"],
  [1, "right"],
];

// e.g. "statuary-bronze" for "Statuary Bronze"
export const toParam = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-");

export type HomeConfigQuery = Record<string, string | string[] | undefined>;

export type Configuration = { finishes: Finishes; decks: Decks };

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

// The finishes and decks a query asks for. Anything it doesn't name, or
// names wrongly, is the default, and its decks are already in place
export const parseConfig = (query: HomeConfigQuery): Configuration => {
  const finishes = FINISH_KEYS.reduce((picked, key) => {
    const param = first(query[key]);
    const option = FINISH_OPTIONS[key].find(
      ({ name }) => toParam(name) === param,
    );
    return option ? { ...picked, [key]: option.value } : picked;
  }, DEFAULT_FINISHES);
  const sides = (first(query.decks) ?? "").split(",");
  const decks = DECK_PARAMS.reduce(
    (landed, [side, param]) =>
      sides.includes(param) ? { ...landed, [side]: "landed" } : landed,
    {} as Decks,
  );
  return { finishes, decks };
};

// The query for a configuration, leaving out the defaults, and any deck on
// its way out
export const serializeConfig = ({
  finishes,
  decks,
}: Configuration): Record<string, string> => {
  const query: Record<string, string> = {};
  FINISH_KEYS.forEach((key) => {
    if (finishes[key] === DEFAULT_FINISHES[key]) return;
    const option = FINISH_OPTIONS[key].find(
      ({ value }) => value === finishes[key],
    );
    if (option) query[key] = toParam(option.name);
  });
  const sides = DECK_PARAMS.filter(([side]) => isDeckUp(decks[side])).map(
    ([, param]) => param,
  );
  if (sides.length) query.decks = sides.join(",");
  return query;
};

// e.g. "floor=concrete&decks=left,right". The values are only ever
// lowercase letters, dashes and commas, so they're written as they are
export const toQueryString = (query: Record<string, string>) =>
  Object.entries(query)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

// A configured home's page, or its checkout with `page` "checkout"
export const getConfigPath = (
  slug: string,
  config: Configuration,
  page?: "checkout",
) => {
  const search = toQueryString(serializeConfig(config));
  return `/homes/${slug}${page ? `/${page}` : ""}${search ? `?${search}` : ""}`;
};

// The name of the swatch picked for each finish, e.g. "Copper" for the
// metal, for the checkout to list
export const getFinishNames = (finishes: Finishes) =>
  FINISH_KEYS.map((key) => ({
    key,
    name:
      FINISH_OPTIONS[key].find(({ value }) => value === finishes[key])?.name ??
      String(finishes[key]),
  }));
