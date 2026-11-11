import {
  DEPOSIT_RATE,
  FACTORY,
  getCraneDays,
  getDeliveryItems,
  getMiles,
  getOrder,
  getRoadMiles,
  getSchedule,
} from "../lib/delivery";
import { getQuote } from "../lib/pricing";
import { SITE } from "../lib/site";
import { DEFAULT_FINISHES } from "../lib/viewerstate";
import MODELS from "../lib/models";

const total = (cols: number, stories: number) =>
  getDeliveryItems(cols, stories).reduce((sum, { amount }) => sum + amount, 0);

describe("delivery", () => {
  it("drives about 55 miles from the factory in San Bernardino to the lot", () => {
    // as the crow flies, then by road
    expect(getMiles(FACTORY, SITE)).toBeGreaterThan(40);
    expect(getMiles(FACTORY, SITE)).toBeLessThan(45);
    expect(getRoadMiles()).toBeGreaterThanOrEqual(50);
    expect(getRoadMiles()).toBeLessThanOrEqual(60);
    expect(getMiles(SITE, SITE)).toBe(0);
  });

  it("trucks each module as its own load and sets them by crane", () => {
    MODELS.forEach(({ cols, stories }) => {
      const modules = cols * stories;
      const items = getDeliveryItems(cols, stories);
      const byId = Object.fromEntries(items.map((item) => [item.id, item]));
      expect(byId.haul.quantity).toBe(modules * getRoadMiles());
      expect(byId.escort.quantity).toBe(modules);
      expect(byId.set.quantity).toBe(modules);
      expect(byId.crane.quantity).toBe(getCraneDays(modules));
      // stacking only where there's an upper story
      expect(byId.stack?.quantity ?? 0).toBe(cols * (stories - 1));
      items.forEach((item) => {
        expect(item.group).toBe("Delivery and set");
        expect(item.amount).toBe(Math.round(item.quantity * item.rate));
      });
    });
  });

  it("sets four modules a day", () => {
    expect([1, 4, 5, 8].map(getCraneDays)).toEqual([1, 1, 2, 2]);
  });

  it("costs more for more modules, and more stacked than side by side", () => {
    [1, 2, 3, 4].forEach((cols) =>
      expect(total(cols + 1, 1)).toBeGreaterThan(total(cols, 1)),
    );
    expect(total(2, 2)).toBeGreaterThan(total(4, 1));
  });
});

describe("order", () => {
  it("adds the delivery to the home's price, and takes a deposit of it", () => {
    MODELS.forEach(({ cols, stories }) => {
      const config = { cols, stories, finishes: DEFAULT_FINISHES, decks: {} };
      const order = getOrder(config);
      expect(order.homeTotal).toBe(getQuote(config).total);
      expect(order.deliveryTotal).toBe(total(cols, stories));
      expect(order.total).toBe(order.homeTotal + order.deliveryTotal);
      expect(order.total).toBe(
        order.items.reduce((sum, { amount }) => sum + amount, 0),
      );
      expect(order.deposit).toBe(Math.round(order.total * DEPOSIT_RATE));
    });
  });
});

describe("schedule", () => {
  const ordered = new Date("2026-11-11T15:30:00Z");

  it("runs from reserving to moving in, in order", () => {
    const milestones = getSchedule(3, 2, ordered);
    expect(milestones[0]).toEqual({ label: "Reserved", date: "2026-11-11" });
    expect(milestones[milestones.length - 1].label).toBe("Ready to move in");
    const dates = milestones.map(({ date }) => date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("takes longer to build more modules", () => {
    const delivered = (cols: number, stories: number) =>
      getSchedule(cols, stories, ordered).find(
        ({ label }) => label === "Delivered to the lot",
      )!.date;
    expect(delivered(4, 2) > delivered(4, 1)).toBe(true);
    expect(delivered(4, 1) > delivered(1, 1)).toBe(true);
  });
});
