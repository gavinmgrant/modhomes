import { SITE } from "./site";
import { getQuote, HomeConfig, LineItem } from "./pricing";

// Getting a home from the factory to its lot and setting it there, and when
// that happens. ModHomes is fictional, and so is its factory, in an
// industrial park by San Bernardino's airport. Each module leaves it as its
// own oversize load, down I-10 to the lot in Palm Springs, where a crane
// sets the modules on the foundation and a crew seals and connects them.
// Like the home's own rates, these are placeholders for a concept

export const FACTORY = {
  label: "ModHomes factory, San Bernardino, CA",
  lat: 34.0846,
  lng: -117.235,
};

export const DELIVERY_RATES = {
  // Per mile, for each module's truck
  haul: 14,
  // Oversize permits and a pilot car, per load
  escort: 1800,
  // A day of the crane and its crew
  craneDay: 8500,
  // Setting a module, sealing its joints and connecting its services
  set: 4200,
  // The extra rigging and bolting of a module set on another
  stack: 2500,
};

// How many modules the crane sets in a day
const MODULES_PER_CRANE_DAY = 4;

// The share of the total taken to reserve a home
export const DEPOSIT_RATE = 0.1;

const EARTH_RADIUS_MILES = 3958.8;
// Roads don't run straight: I-10 from the factory to the lot is about a
// quarter longer than the line between them
const ROAD_FACTOR = 1.25;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

// Great-circle distance, in miles
export const getMiles = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) => {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
};

// The drive from the factory to the lot, to the mile
export const getRoadMiles = () =>
  Math.round(getMiles(FACTORY, SITE) * ROAD_FACTOR);

export const getCraneDays = (modules: number) =>
  Math.ceil(modules / MODULES_PER_CRANE_DAY);

export const getDeliveryItems = (cols: number, stories: number): LineItem[] => {
  const modules = cols * stories;
  const miles = getRoadMiles();
  const item = (
    id: string,
    label: string,
    quantity: number,
    unit: string,
    rate: number,
  ): LineItem => ({
    id,
    group: "Delivery and set",
    label,
    quantity,
    unit,
    rate,
    amount: Math.round(quantity * rate),
  });
  return [
    item(
      "haul",
      `Trucking, ${modules} ${modules === 1 ? "load" : "loads"} × ${miles} mi`,
      modules * miles,
      "mi",
      DELIVERY_RATES.haul,
    ),
    item(
      "escort",
      "Oversize permits and escorts",
      modules,
      "load",
      DELIVERY_RATES.escort,
    ),
    item(
      "crane",
      "Crane and crew",
      getCraneDays(modules),
      "day",
      DELIVERY_RATES.craneDay,
    ),
    item(
      "set",
      "Setting, sealing and connecting",
      modules,
      "module",
      DELIVERY_RATES.set,
    ),
    item(
      "stack",
      "Stacking the upper story",
      cols * (stories - 1),
      "module",
      DELIVERY_RATES.stack,
    ),
  ].filter(({ quantity }) => quantity > 0);
};

export type Order = {
  items: LineItem[];
  // The home as configured, then its delivery and set
  homeTotal: number;
  deliveryTotal: number;
  total: number;
  deposit: number;
};

export const getOrder = (config: HomeConfig): Order => {
  const home = getQuote(config);
  const delivery = getDeliveryItems(config.cols, config.stories);
  const deliveryTotal = delivery.reduce((sum, { amount }) => sum + amount, 0);
  const total = home.total + deliveryTotal;
  return {
    items: [...home.items, ...delivery],
    homeTotal: home.total,
    deliveryTotal,
    total,
    deposit: Math.round(total * DEPOSIT_RATE),
  };
};

export type Milestone = { label: string; date: string };

const DAY = 24 * 60 * 60 * 1000;
const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY);
// As a date alone, in UTC, so the server and browser agree on it
const toDate = (date: Date) => date.toISOString().slice(0, 10);

// From the order to moving in: engineering and permits, building the
// modules, which takes longer the more there are, trucking them and
// setting them, then the finish work on site
export const getSchedule = (
  cols: number,
  stories: number,
  ordered: Date,
): Milestone[] => {
  const modules = cols * stories;
  const buildStarts = addDays(ordered, 3 * 7);
  const built = addDays(buildStarts, (4 + 2 * modules) * 7);
  const delivered = addDays(built, 7);
  const set = addDays(delivered, getCraneDays(modules) - 1);
  const moveIn = addDays(set, 6 * 7);
  return [
    { label: "Reserved", date: toDate(ordered) },
    { label: "Building starts", date: toDate(buildStarts) },
    { label: "Delivered to the lot", date: toDate(delivered) },
    { label: "Set on its foundation", date: toDate(set) },
    { label: "Ready to move in", date: toDate(moveIn) },
  ];
};

// e.g. "Mar 4, 2027", for a date from getSchedule
export const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
