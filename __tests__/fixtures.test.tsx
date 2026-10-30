import {
  doors,
  DRAWER_HEIGHT,
  drawersOverDoors,
  fronts,
  LocalPart,
} from "../components/fixtures";

const middle = ({ u }: LocalPart) => (u[0] + u[1]) / 2;
const pulls = (parts: LocalPart[]) =>
  parts.filter((part) => part.finish === "stainless");
const panels = (parts: LocalPart[]) =>
  parts.filter((part) => part.finish === "walnut");

describe("cabinet fronts", () => {
  it("centres a drawer's pull", () => {
    const parts = fronts([0, 3], [0, 1], 0, 2, "top");
    panels(parts).forEach((panel, i) =>
      expect(middle(pulls(parts)[i])).toBeCloseTo(middle(panel)),
    );
  });

  it("pairs doors, their pulls either side of the gap between them", () => {
    const parts = doors([0, 4], [0, 2], 0, 2, "top");
    const [left, right] = pulls(parts).map(middle);
    expect(left).toBeGreaterThan(1.5);
    expect(left).toBeLessThan(2);
    expect(right).toBeGreaterThan(2);
    expect(right).toBeLessThan(2.5);
  });

  it("opens a lone door away from its hinge", () => {
    const [toHigh] = pulls(doors([0, 2], [0, 2], 0, 1, "top", 1)).map(middle);
    const [toLow] = pulls(doors([0, 2], [0, 2], 0, 1, "top", -1)).map(middle);
    expect(toHigh).toBeGreaterThan(1.5);
    expect(toLow).toBeLessThan(0.5);
    // the odd one out of three opens on its own
    const three = pulls(doors([0, 3], [0, 2], 0, 3, "top", -1)).map(middle);
    expect(three[0]).toBeGreaterThan(0.5);
    expect(three[1]).toBeLessThan(1.5);
    expect(three[2]).toBeLessThan(2.5);
  });

  it("puts a drawer over each base cabinet door", () => {
    const parts = drawersOverDoors([0, 4], [0, 2.5], 0, 2);
    const [drawers, doorPanels] = [
      panels(parts).filter((panel) => panel.y[0] > 1),
      panels(parts).filter((panel) => panel.y[0] < 1),
    ];
    expect(drawers).toHaveLength(2);
    expect(doorPanels).toHaveLength(2);
    drawers.forEach((drawer) => {
      expect(drawer.y[1] - drawer.y[0]).toBeCloseTo(DRAWER_HEIGHT);
      expect(drawer.y[1]).toBeCloseTo(2.5);
    });
    const tops = pulls(parts).filter((pull) => pull.y[0] > 2);
    const lower = pulls(parts).filter((pull) => pull.y[0] < 2);
    tops.forEach((pull, i) =>
      expect(middle(pull)).toBeCloseTo(middle(drawers[i])),
    );
    // the door pulls meet at the gap, not centred
    expect(lower.map(middle).every((u) => Math.abs(u - 2) < 0.5)).toBe(true);
  });
});
