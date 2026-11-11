import { MODULE } from "./dimensions";
import { APPLIANCES, ApplianceId } from "./appliances";
import { DEFAULT_FINISHES, Finishes } from "./viewerstate";
import type { Model } from "./models";
import { getPaneLayout } from "../components/slidingdoors";
import {
  getApplianceSpots,
  getGalleyLayout,
  getServicesLayout,
  getSidedPanes,
  hasGalley,
  hasServices,
} from "../components/services";
import { getRoomPlan, getRoomsLayout } from "../components/rooms";
import { FOUNDATION, getStemWalls } from "../components/foundation";
import { Decks, DeckSide, isDeckUp } from "../components/deck";
import {
  METAL_OPTIONS,
  TRIM_OPTIONS,
  WOOD_OPTIONS,
} from "../components/colors";
import { FLOOR_OPTIONS, TILE_OPTIONS } from "../components/materials";

// What a home costs, as configured. The quantities come from the same
// layout functions that draw it, so a 4x1 and a 2x2, both four modules, are
// priced by what each is built from: the 2x2 has twice the glass, a stair
// and stacked modules, and the 4x1 twice the roof, more foundation and a
// full kitchen with two baths. The rates are placeholders for a concept, in
// dollars, kept here in one place to tune

export const RATES = {
  // Steel frame, floor deck, ceiling, insulation and rough-in, per module.
  // The floor's finish is priced on its own, by the square foot
  module: 57520,
  // Heavier columns and connections under a module stacked on another
  stackedModule: 8000,
  // Each full-height sliding glass pane
  glassPane: 4800,
  // A pane a room stands against, built as cedar siding instead of glass
  cedarPane: 1900,
  // Insulated metal panel at each end of a module, per story
  endWallPanel: 3600,
  // Per square foot of footprint
  roof: 38,
  // Per linear foot of 8" concrete stem wall
  stemWall: 210,
  stair: 32000,
  // Cabinets, counters, fixtures and tile, without the appliances: the full
  // kitchen and two baths of a home three or more modules wide, and the
  // galley, bath and closet of a two-wide one
  services: 78000,
  galley: 36000,
  // A covered deck, with its frame, roof and stem walls
  deck: 42000,
  // Per linear foot of full-height bedroom and closet wall, door openings
  // and all
  interiorWall: 90,
  // Each pocket door, frame and walnut leaf
  pocketDoor: 1400,
  // The bath stacked upstairs over the tub bath, and in a 2x2 the shower
  // bath over the galley's, with the plumbing run up to it
  upperBath: 42000,
  upperShowerBath: 34000,
};

// What each finish adds, by the option's name, in the unit its line is
// priced in: metal per module, trim per glass pane, wood per cedar pane and
// per deck, and tile once per home. 0 is included. The floor is different:
// every home has one, so each option is its full price per square foot,
// laid, and the dock's default, walnut, is in the starting price. Every
// swatch in the dock has an entry, which a test checks
export const FINISH_RATES = {
  metal: { White: 0, Taupe: 0, Copper: 1500, Grey: 0 },
  trim: {
    "Bone White": 0,
    "Charcoal Gray": 0,
    "Fashion Gray": 0,
    "Statuary Bronze": 0,
  },
  woodSiding: { Natural: 0, Cedar: 0, Walnut: 400, Espresso: 400 },
  woodDeck: { Natural: 0, Cedar: 0, Walnut: 3000, Espresso: 3000 },
  // Carpet the least, bamboo a little under walnut, and concrete, a poured
  // topping on the steel floor deck, heavier and slower than boards, the most
  floor: { Carpet: 6, Bamboo: 12, Walnut: 14, Concrete: 22 },
  tile: {
    "Arctic White": 0,
    "Urban Putty": 0,
    "Desert Gray": 0,
    Chalkboard: 0,
  },
} as Record<string, Record<string, number>>;

export type Quantities = {
  modules: number;
  // Modules standing on another
  stackedModules: number;
  glassPanes: number;
  cedarPanes: number;
  endWallPanels: number;
  // Square feet
  roofArea: number;
  floorArea: number;
  // Linear feet
  stemWall: number;
  stair: boolean;
  kitchen: "services" | "galley" | null;
  appliances: ApplianceId[];
  decks: number;
  bedrooms: number;
  baths: number;
  // The upstairs bath, if the home has one
  upperBath: "hall" | "shower" | null;
  // Linear feet of bedroom and closet wall
  interiorWall: number;
  pocketDoors: number;
};

export const getQuantities = (
  cols: number,
  stories: number,
  decks: Decks = {},
): Quantities => {
  const modules = cols * stories;
  // Both long sides are glass, every story
  const panes = getPaneLayout(1, (MODULE.width * cols) / 2, stories).length * 2;
  const cedarPanes = getSidedPanes(cols, stories).length;
  const { inset } = FOUNDATION;
  const stemWall = getStemWalls(
    MODULE.width * cols - 2 * inset,
    MODULE.length - 2 * inset,
  ).reduce((sum, { size: [x, , z] }) => sum + Math.max(x, z), 0);
  const appliances = getApplianceSpots(cols).map(({ appliance }) => appliance);
  const kitchen = hasServices(cols)
    ? "services"
    : hasGalley(cols)
      ? "galley"
      : null;
  const plan = getRoomPlan(cols, stories);
  const rooms = getRoomsLayout(cols, stories);
  const services = getServicesLayout(cols) ?? getGalleyLayout(cols);
  return {
    modules,
    stackedModules: cols * (stories - 1),
    glassPanes: panes - cedarPanes,
    cedarPanes,
    endWallPanels: 2 * modules,
    roofArea: MODULE.width * cols * MODULE.length,
    floorArea: MODULE.width * MODULE.length * modules,
    stemWall,
    stair: stories > 1,
    kitchen,
    appliances: appliances.filter((id, i) => appliances.indexOf(id) === i),
    decks: ([-1, 1] as DeckSide[]).filter((side) => isDeckUp(decks[side]))
      .length,
    bedrooms: plan.bedrooms.length,
    baths:
      (kitchen === "services" ? 2 : kitchen === "galley" ? 1 : 0) +
      (plan.upperBath ? 1 : 0),
    upperBath: plan.upperBath,
    interiorWall: rooms.reduce(
      (sum, { runs }) => sum + runs.reduce((a, b) => a + b, 0),
      0,
    ),
    pocketDoors:
      (services?.leaves.length ?? 0) +
      rooms.reduce((sum, { leaves }) => sum + leaves.length, 0),
  };
};

export type LineGroup =
  | "Structure"
  | "Envelope"
  | "Interior"
  | "Kitchen and baths"
  | "Decks"
  | "Finishes"
  // Added at the checkout, from lib/delivery.ts
  | "Delivery and set";

export type LineItem = {
  id: string;
  group: LineGroup;
  label: string;
  quantity: number;
  // What one of the quantity is, e.g. "pane" or "sq ft"
  unit: string;
  rate: number;
  amount: number;
};

export type Quote = { items: LineItem[]; total: number };

export type HomeConfig = {
  cols: number;
  stories: number;
  finishes: Finishes;
  decks: Decks;
};

// The swatch's name for a finish's value, e.g. "Copper" for its hex color
const optionName = (
  options: readonly { name: string; value: string }[],
  value: string,
) => options.find((option) => option.value === value)?.name ?? value;

export const getFinishRate = (
  category: keyof typeof FINISH_RATES,
  name: string,
) => FINISH_RATES[category]?.[name] ?? 0;

export const getQuote = ({
  cols,
  stories,
  finishes,
  decks,
}: HomeConfig): Quote => {
  const q = getQuantities(cols, stories, decks);
  const items: LineItem[] = [];
  const line = (
    id: string,
    group: LineGroup,
    label: string,
    quantity: number,
    unit: string,
    rate: number,
  ) => {
    if (quantity > 0) {
      items.push({
        id,
        group,
        label,
        quantity,
        unit,
        rate,
        amount: Math.round(quantity * rate),
      });
    }
  };

  line("modules", "Structure", "Modules", q.modules, "module", RATES.module);
  line(
    "stacking",
    "Structure",
    "Stacked module framing",
    q.stackedModules,
    "module",
    RATES.stackedModule,
  );
  line(
    "foundation",
    "Structure",
    "Concrete stem wall foundation",
    Math.round(q.stemWall),
    "ft",
    RATES.stemWall,
  );
  line("stair", "Structure", "Stair", q.stair ? 1 : 0, "stair", RATES.stair);

  line(
    "glass",
    "Envelope",
    "Sliding glass panes",
    q.glassPanes,
    "pane",
    RATES.glassPane,
  );
  line(
    "cedar",
    "Envelope",
    "Cedar siding panels",
    q.cedarPanes,
    "panel",
    RATES.cedarPane,
  );
  line(
    "endWalls",
    "Envelope",
    "End wall panels",
    q.endWallPanels,
    "panel",
    RATES.endWallPanel,
  );
  line("roof", "Envelope", "Roof", q.roofArea, "sq ft", RATES.roof);

  line(
    "interiorWalls",
    "Interior",
    "Bedroom and closet walls",
    Math.round(q.interiorWall),
    "ft",
    RATES.interiorWall,
  );
  line(
    "pocketDoors",
    "Interior",
    "Pocket doors",
    q.pocketDoors,
    "door",
    RATES.pocketDoor,
  );
  if (q.kitchen === "services") {
    line(
      "services",
      "Kitchen and baths",
      "Kitchen and two baths",
      1,
      "home",
      RATES.services,
    );
  } else if (q.kitchen === "galley") {
    line(
      "galley",
      "Kitchen and baths",
      "Galley kitchen, bath and closet",
      1,
      "home",
      RATES.galley,
    );
  }
  if (q.upperBath === "hall") {
    line(
      "upperBath",
      "Kitchen and baths",
      "Upstairs bath",
      1,
      "home",
      RATES.upperBath,
    );
  } else if (q.upperBath === "shower") {
    line(
      "upperShowerBath",
      "Kitchen and baths",
      "Upstairs shower bath",
      1,
      "home",
      RATES.upperShowerBath,
    );
  }
  q.appliances.forEach((id) => {
    const { kind, standard } = APPLIANCES[id];
    line(
      id,
      "Kitchen and baths",
      `${kind}: ${standard.brand} ${standard.model}`,
      1,
      "appliance",
      standard.price,
    );
  });

  line("decks", "Decks", "Covered decks", q.decks, "deck", RATES.deck);

  const metal = optionName(METAL_OPTIONS, finishes.metal);
  const trim = optionName(TRIM_OPTIONS, finishes.trim);
  const wood = optionName(WOOD_OPTIONS, finishes.wood);
  const floor = optionName(FLOOR_OPTIONS, finishes.floor);
  const tile = optionName(TILE_OPTIONS, finishes.tile);
  line(
    "metal",
    "Finishes",
    `${metal} metal siding`,
    q.modules,
    "module",
    getFinishRate("metal", metal),
  );
  line(
    "trim",
    "Finishes",
    `${trim} trim`,
    q.glassPanes,
    "pane",
    getFinishRate("trim", trim),
  );
  line(
    "woodSiding",
    "Finishes",
    `${wood} wood siding`,
    q.cedarPanes,
    "panel",
    getFinishRate("woodSiding", wood),
  );
  line(
    "woodDecks",
    "Finishes",
    `${wood} wood decks`,
    q.decks,
    "deck",
    getFinishRate("woodDeck", wood),
  );
  line(
    "floor",
    "Finishes",
    `${floor} floor`,
    q.floorArea,
    "sq ft",
    getFinishRate("floor", floor),
  );
  line(
    "tile",
    "Finishes",
    `${tile} wall tile`,
    q.kitchen ? 1 : 0,
    "home",
    getFinishRate("tile", tile),
  );

  return {
    items,
    total: items.reduce((sum, { amount }) => sum + amount, 0),
  };
};

// The price of a model with the dock's default finishes, all of which are
// included, and no decks: what it costs as it first opens
export const getStartingPrice = ({
  cols,
  stories,
}: Pick<Model, "cols" | "stories">) =>
  getQuote({ cols, stories, finishes: DEFAULT_FINISHES, decks: {} }).total;

// e.g. $525,600
export const PRICE = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

// e.g. $526K, $1.03M
export const PRICE_SHORT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumSignificantDigits: 3,
});
