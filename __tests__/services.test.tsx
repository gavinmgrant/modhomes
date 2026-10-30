import {
  BLOCK_FRONT,
  DOOR_HEIGHT,
  WALL_END,
  END_FACE,
  getServicesLayout,
  getServicesModuleX,
  hasServices,
  ROOMS,
} from "../components/services";
import { POST_INSET, POST_SIZE } from "../components/module";
import { COUNTER_DEPTH } from "../components/kitchen";
import { getShowerBath, getTubBath, DOOR_WIDTH } from "../components/bathroom";
import { CEILING, FLOOR, Part } from "../components/fixtures";
import { getStairLayout } from "../components/stair";
import { parseModel } from "../components/homemodel";
import MODELS from "../lib/models";

const span = ({ position, size }: Part, axis: number) => [
  position[axis] - size[axis] / 2,
  position[axis] + size[axis] / 2,
];

const overlap = (a: number[], b: number[]) =>
  Math.min(a[1], b[1]) - Math.max(a[0], b[0]) > 1e-6;

const WIDE = [3, 4, 5];

describe("services module", () => {
  it("is only in homes three or more modules wide", () => {
    MODELS.forEach(({ slug }) => {
      const { cols } = parseModel(slug)!;
      expect(hasServices(cols)).toBe(cols >= 3);
      expect(getServicesLayout(cols) === null).toBe(cols < 3);
    });
  });

  it("takes the middle module, right of centre when there are four", () => {
    // module centres run from -4 * cols + 4 in steps of 8
    expect(getServicesModuleX(3)).toBe(0);
    expect(getServicesModuleX(4)).toBe(4);
    expect(getServicesModuleX(5)).toBe(0);
  });

  it.each(WIDE)(
    "keeps every wall and fixture inside the module, floor to ceiling (%i wide)",
    (cols) => {
      const { walls, fixtures } = getServicesLayout(cols)!;
      [...walls, ...fixtures].forEach((part) => {
        const [x0, x1] = span(part, 0);
        const [y0, y1] = span(part, 1);
        const [z0, z1] = span(part, 2);
        // short of the module's edge, where the next module's posts start
        expect(x0).toBeGreaterThanOrEqual(-4 - 1e-9);
        expect(x1).toBeLessThanOrEqual(4 + 1e-9);
        expect(y0).toBeGreaterThanOrEqual(FLOOR - 1e-9);
        expect(y1).toBeLessThanOrEqual(CEILING + 1e-9);
        expect(z0).toBeGreaterThanOrEqual(-END_FACE - 1e-9);
        expect(z1).toBeLessThanOrEqual(END_FACE + 1e-9);
      });
    },
  );

  it("builds the bathroom walls full height, from the end wall to the kitchen", () => {
    const { walls } = getServicesLayout(3)!;
    const full = walls.filter(
      (wall) => Math.abs(span(wall, 1)[0] - FLOOR) < 1e-9,
    );
    // the two side walls either side of each door, and the two cross walls
    expect(full).toHaveLength(8);
    full.forEach((wall) => expect(span(wall, 1)[1]).toBeCloseTo(CEILING));
    const zs = walls
      .filter((wall) => span(wall, 2)[0] < 0)
      .flatMap((wall) => span(wall, 2));
    expect(Math.min(...zs)).toBeCloseTo(-END_FACE);
    expect(Math.max(...zs)).toBeCloseTo(WALL_END);
  });

  it("leaves a 2'-6\" x 6'-8\" doorway into each bathroom", () => {
    const { walls, doors } = getServicesLayout(3)!;
    expect(doors).toHaveLength(2);
    // one from each side of the module
    expect(doors.map((door) => door.side).sort()).toEqual([-1, 1]);
    doors.forEach(({ side, z }) => {
      expect(z[1] - z[0]).toBeCloseTo(DOOR_WIDTH);
      const inWay = walls.filter(
        (wall) =>
          Math.sign(wall.position[0]) === side &&
          wall.size[0] < 1 &&
          overlap(span(wall, 2), z),
      );
      // only the header crosses it, 6'-8" up
      expect(inWay).toHaveLength(1);
      expect(span(inWay[0], 1)[0]).toBeCloseTo(FLOOR + DOOR_HEIGHT);
      expect(DOOR_HEIGHT * 12).toBeCloseTo(80);
    });
  });

  it("keeps each bathroom's fixtures inside its walls, clear of its door", () => {
    [
      [getTubBath(ROOMS.tubBath), ROOMS.tubBath],
      [getShowerBath(ROOMS.showerBath), ROOMS.showerBath],
    ].forEach(([{ parts, door }, room]: any) => {
      parts.forEach((part: Part) => {
        const [x0, x1] = span(part, 0);
        const [z0, z1] = span(part, 2);
        expect(x0).toBeGreaterThanOrEqual(room.x[0] - 1e-9);
        expect(x1).toBeLessThanOrEqual(room.x[1] + 1e-9);
        expect(z0).toBeGreaterThanOrEqual(room.z[0] - 1e-9);
        expect(z1).toBeLessThanOrEqual(room.z[1] + 1e-9);
      });
      // nothing standing in the doorway, a step in from the wall
      const doorX = door.side * room.x[1];
      const step: [number, number] = [doorX - 1.5, doorX + 1.5];
      parts
        .filter((part: Part) => span(part, 1)[1] > FLOOR + 0.1)
        .forEach((part: Part) => {
          expect(
            overlap(span(part, 0), step) && overlap(span(part, 2), door.z),
          ).toBe(false);
        });
    });
  });

  it.each(WIDE)("never runs a fixture into a wall (%i wide)", (cols) => {
    const { walls, fixtures } = getServicesLayout(cols)!;
    fixtures.forEach((fixture) => {
      walls.forEach((wall) => {
        const hits = [0, 1, 2].every((axis) =>
          overlap(span(fixture, axis), span(wall, axis)),
        );
        expect(hits).toBe(false);
      });
    });
  });

  it("covers its own middle posts with the side walls, framing the tall unit", () => {
    const { walls, fixtures } = getServicesLayout(3)!;
    // this module's posts where it meets its neighbours, at z = 0
    const post = {
      x: [4 - POST_INSET - POST_SIZE, 4 - POST_INSET],
      z: [-POST_SIZE / 2, POST_SIZE / 2],
    };
    const ahead = walls.filter(
      (wall) => span(wall, 2)[0] < post.z[0] && span(wall, 2)[1] > post.z[1],
    );
    expect(ahead).toHaveLength(2);
    ahead.forEach((wall) => {
      const [x0, x1] = span(wall, 0);
      const [p0, p1] = x0 > 0 ? post.x : [-post.x[1], -post.x[0]];
      // around the post on both faces, and past it toward the kitchen
      expect(x0).toBeLessThan(p0);
      expect(x1).toBeGreaterThan(p1);
      expect(span(wall, 2)[0]).toBeLessThan(post.z[0]);
      expect(span(wall, 2)[1]).toBeCloseTo(WALL_END);
      expect(span(wall, 1)[0]).toBeCloseTo(FLOOR);
      expect(span(wall, 1)[1]).toBeCloseTo(CEILING);
    });
    // the pantry and fridge wall stands between them, its doors flush with
    // their ends and 2" in front of the posts
    const carcass = fixtures.find(
      (part) =>
        part.finish === "walnut" &&
        span(part, 1)[0] === FLOOR &&
        overlap(span(part, 2), post.z),
    )!;
    const [left, right] = ahead
      .map((wall) => span(wall, 0))
      .sort((a, b) => a[0] - b[0]);
    expect(span(carcass, 0)[0]).toBeCloseTo(left[1]);
    expect(span(carcass, 0)[1]).toBeCloseTo(right[0]);
    expect(span(carcass, 2)[0]).toBeCloseTo(BLOCK_FRONT);
    expect(span(carcass, 1)[1]).toBeCloseTo(CEILING);
    expect((WALL_END - post.z[1]) * 12).toBeGreaterThan(1.5);
  });

  it("frames the range run with short walls in line with the side walls", () => {
    const { walls, fixtures } = getServicesLayout(3)!;
    const ends = walls.filter((wall) => span(wall, 2)[0] > 0);
    expect(ends).toHaveLength(2);
    const sides = walls.filter(
      (wall) => span(wall, 2)[1] > 0 && span(wall, 2)[0] < 0,
    );
    ends.forEach((end) => {
      // the same thickness and line as the side wall on its side
      const side = sides.find(
        (wall) => Math.sign(wall.position[0]) === Math.sign(end.position[0]),
      )!;
      expect(span(end, 0)[0]).toBeCloseTo(span(side, 0)[0]);
      expect(span(end, 0)[1]).toBeCloseTo(span(side, 0)[1]);
      // from the end wall out to the counter's front edge
      expect(span(end, 2)[1]).toBeCloseTo(END_FACE);
      expect(span(end, 2)[0]).toBeCloseTo(END_FACE - COUNTER_DEPTH);
      expect(span(end, 1)[0]).toBeCloseTo(FLOOR);
      expect(span(end, 1)[1]).toBeCloseTo(CEILING);
    });
    // and the counter fits between them
    const counters = fixtures.filter(
      (part) => part.finish === "quartz" && span(part, 2)[0] > END_FACE - 3,
    );
    expect(counters.length).toBeGreaterThan(0);
    counters.forEach((counter) => {
      ends.forEach((end) =>
        expect(overlap(span(counter, 0), span(end, 0))).toBe(false),
      );
      expect(span(counter, 2)[0]).toBeCloseTo(END_FACE - COUNTER_DEPTH);
    });
  });

  it.each([3, 4])("stays clear of the stair in %ix2 homes", (cols) => {
    const { moduleX, walls, fixtures } = getServicesLayout(cols)!;
    const { opening } = getStairLayout(cols);
    [...walls, ...fixtures].forEach((part) => {
      const [x0, x1] = span(part, 0).map((x) => x + moduleX);
      expect(
        overlap([x0, x1], opening.x) && overlap(span(part, 2), opening.z),
      ).toBe(false);
    });
  });
});
