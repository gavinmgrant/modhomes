import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  createFacingStore,
  DECK,
  DECK_DROP,
  DECK_SLIDE,
  DECK_STAIR,
  HOME_END,
  DeckBox,
  DeckToggle,
  getBoxesGeometry,
  getDeckLayout,
  getDeckOffset,
  getDecksLength,
  getDecksWidth,
  getFoundationRise,
  getTrianglesGeometry,
  HIP_RISE,
  isDeckMoving,
  getFacingSide,
  landDecks,
  settleDeck,
  toggleDeck,
} from "../components/deck";
import { FLOOR } from "../components/fixtures";
import { FOUNDATION, getStemWalls } from "../components/foundation";
import { getParapetTop, MODEL_BASE, MODULE } from "../lib/dimensions";
import { POST_SIZE } from "../components/module";
import {
  END_WALL_FACE,
  getFloorBandLayouts,
  getHeaderLayout,
  getPaneJoints,
} from "../components/slidingdoors";
import { getNormal, Point } from "../components/roof";

const extent = (boxes: DeckBox[], axis: number) => [
  Math.min(...boxes.map((b) => b.position[axis] - b.size[axis] / 2)),
  Math.max(...boxes.map((b) => b.position[axis] + b.size[axis] / 2)),
];

// Two boxes with faces in the same plane, facing the same way, that overlap:
// the GPU can't tell which is in front, so they flicker where they meet
const sharedFace = (a: DeckBox, b: DeckBox) =>
  [0, 1, 2].some((axis) =>
    [1, -1].some((sign) => {
      const face = (box: DeckBox) =>
        box.position[axis] + (sign * box.size[axis]) / 2;
      if (Math.abs(face(a) - face(b)) > 1e-6) return false;
      return [0, 1, 2]
        .filter((other) => other !== axis)
        .every((other) => {
          const [a0, a1] = extent([a], other);
          const [b0, b1] = extent([b], other);
          return Math.min(a1, b1) - Math.max(a0, b0) > 1e-6;
        });
    }),
  );

const isPost = ({ size }: DeckBox) =>
  Math.abs(size[0] - POST_SIZE) < 1e-6 && Math.abs(size[2] - POST_SIZE) < 1e-6;

const top = (box: DeckBox) => box.position[1] + box.size[1] / 2;

describe("deck layout", () => {
  it.each([1, 2])(
    "lines its roof and fascia up with the home's, %i stories",
    (stories) => {
      const halfWidth = 8;
      const { roof, hip, frame } = getDeckLayout(1, halfWidth, stories);
      // level with the parapet, or a two-story home's band between stories
      const expected =
        stories === 1
          ? getParapetTop(1)
          : top(getFloorBandLayouts(1, halfWidth, 2)[0]);
      // the hip's ridge, with its eaves on the slab under it
      const heights = hip.flat().map(([, y]) => y);
      expect(Math.max(...heights)).toBeCloseTo(expected);
      expect(Math.min(...heights)).toBeCloseTo(top(roof));
      expect(top(roof)).toBeCloseTo(expected - HIP_RISE);
      expect(extent(frame, 1)[1]).toBeCloseTo(expected);
      // the fascia's underside, where the posts meet it, in line with the
      // underside of the home's top beam, just over its door header
      const header = getHeaderLayout(1, halfWidth, 1);
      frame
        .filter(isPost)
        .forEach((post) => expect(top(post)).toBeCloseTo(top(header)));
    },
  );

  it.each([
    [-1, 4],
    [1, 4],
    [1, 12],
  ] as const)(
    "stands 8 ft out from the glass side's frame, side %i, %i ft half width",
    (side, halfWidth) => {
      const { frame, roof, boards, slats } = getDeckLayout(side, halfWidth);
      const all = [...frame, roof, ...boards, ...slats];
      const [x0, x1] = extent(all, 0);
      const inner = halfWidth + END_WALL_FACE;
      const expected = [inner, inner + DECK.depth].map((x) => side * x);
      expect([x0, x1]).toEqual(
        expected.sort((a, b) => a - b).map((x) => expect.closeTo(x)),
      );
      // slid along the home
      const slide = side * DECK_SLIDE;
      expect(extent(all, 2)).toEqual([
        expect.closeTo(-DECK.length / 2 + slide),
        expect.closeTo(DECK.length / 2 + slide),
      ]);
    },
  );

  it.each([-1, 1] as const)(
    "has no two parts flickering where they meet, side %i",
    (side) => {
      const halfWidth = 8;
      const { foundation, frame, roof, boards, slats, treads } = getDeckLayout(
        side,
        halfWidth,
      );
      // and the home's own stem walls, which the deck's meet
      const home = getStemWalls(
        2 * (halfWidth - FOUNDATION.inset),
        40 - 2 * FOUNDATION.inset,
      ).map(({ position: [x, , z], size }) => ({
        position: [
          x,
          MODEL_BASE + FOUNDATION.height / 2,
          z,
        ] as DeckBox["position"],
        size,
      }));
      const parts = [
        ...home,
        ...foundation,
        ...frame,
        roof,
        ...boards,
        ...slats,
        ...treads,
      ];
      const clashes = parts.flatMap((a, i) =>
        parts
          .slice(i + 1)
          .filter((b) => sharedFace(a, b))
          .map((b) => [a.position, b.position]),
      );
      expect(clashes).toEqual([]);
    },
  );

  it("lays boards flush with the ground floor, across the whole deck", () => {
    const { boards } = getDeckLayout(1, 8);
    boards.forEach(({ position, size }) =>
      expect(position[1] + size[1] / 2).toBeCloseTo(FLOOR),
    );
    const [x0, x1] = extent(boards, 0);
    expect(x1 - x0).toBeCloseTo(DECK.depth);
    // gaps between them, and none overlapping
    const sorted = [...boards].sort((a, b) => a.position[0] - b.position[0]);
    sorted.slice(1).forEach((board, i) => {
      const gap =
        board.position[0] -
        board.size[0] / 2 -
        (sorted[i].position[0] + sorted[i].size[0] / 2);
      expect(gap).toBeGreaterThan(0);
    });
  });

  it("stands its posts on the floor frame, not the ground", () => {
    const { frame, boards } = getDeckLayout(1, 8);
    const boardsTop = boards[0].position[1] + boards[0].size[1] / 2;
    const posts = frame.filter(isPost);
    expect(posts).toHaveLength(6);
    posts.forEach(({ position, size }) =>
      expect(position[1] - size[1] / 2).toBeCloseTo(boardsTop),
    );
  });

  it.each([-1, 1] as const)(
    "sits on stem walls it cantilevers past like the home, side %i",
    (side) => {
      const halfWidth = 8;
      const { foundation, frame } = getDeckLayout(side, halfWidth);
      const [x0, x1] = extent(foundation, 0);
      const [f0, f1] = extent(frame, 0);
      const [inner, outer] = side > 0 ? [x0, x1] : [-x1, -x0];
      // past the stem wall's outer edge and ends by the home's cantilever
      expect(side > 0 ? f1 - x1 : x0 - f0).toBeCloseTo(FOUNDATION.inset);
      expect(outer).toBeCloseTo(
        halfWidth + END_WALL_FACE + DECK.depth - FOUNDATION.inset,
      );
      const slide = side * DECK_SLIDE;
      expect(extent(foundation, 2)).toEqual([
        expect.closeTo(-DECK.length / 2 + FOUNDATION.inset + slide),
        expect.closeTo(DECK.length / 2 - FOUNDATION.inset + slide),
      ]);
      // meeting the home's own stem wall, from the ground up to its top
      expect(inner).toBeCloseTo(halfWidth - FOUNDATION.inset);
      expect(extent(foundation, 1)).toEqual([
        expect.closeTo(MODEL_BASE),
        expect.closeTo(MODEL_BASE + FOUNDATION.height),
      ]);
      // 8" walls along the outer edge, and along the inner edge only past
      // the home's end, set in from the deck's edge, from the home's end
      // stem wall on out
      const sideWalls = foundation.filter(
        ({ size }) => Math.abs(size[0] - FOUNDATION.wall) < 1e-6,
      );
      expect(sideWalls.map(({ position }) => side * position[0])).toEqual([
        expect.closeTo(outer - FOUNDATION.wall / 2),
        expect.closeTo(
          halfWidth + END_WALL_FACE + FOUNDATION.inset + FOUNDATION.wall / 2,
        ),
      ]);
      const [, past] = sideWalls;
      expect(
        extent([past], 2)
          .map((z) => side * z)
          .sort((a, b) => a - b)[0],
      ).toBeCloseTo(MODULE.length / 2 - FOUNDATION.inset);
      foundation
        .filter((wall) => !sideWalls.includes(wall))
        .forEach(({ size }) => expect(size[2]).toBeCloseTo(FOUNDATION.wall));
    },
  );

  it("rises as far as the home's hip roof, from its slab to the parapet", () => {
    // the home's roof slab is 0.75 thick, centred 5.3 up
    expect(HIP_RISE).toBeCloseTo(getParapetTop(1) - (5.3 + 0.75 / 2));
  });

  it.each([-1, 1] as const)(
    "keeps its hip over the slab, sloping up from every edge, side %i",
    (side) => {
      const { roof, hip } = getDeckLayout(side, 8);
      const points = hip.flat();
      [0, 2].forEach((axis) => {
        const [lo, hi] = extent([roof], axis);
        const values = points.map((point) => point[axis]);
        expect(Math.min(...values)).toBeCloseTo(lo);
        expect(Math.max(...values)).toBeCloseTo(hi);
      });
      const { normals } = getTrianglesGeometry(hip);
      for (let i = 1; i < normals.length; i += 3) {
        expect(normals[i]).toBeGreaterThan(0);
      }
    },
  );

  it("hangs the soffit slats under the roof, centred along the deck", () => {
    const { roof, slats } = getDeckLayout(1, 8);
    const roofBottom = roof.position[1] - roof.size[1] / 2;
    slats.forEach(({ position, size }) =>
      expect(position[1] + size[1] / 2).toBeCloseTo(roofBottom),
    );
    const [z0, z1] = extent(slats, 2);
    expect((z0 + z1) / 2).toBeCloseTo(DECK_SLIDE);
  });

  it("slides the two sides' decks a pane in opposite directions", () => {
    const middle = (side: -1 | 1) => {
      const [z0, z1] = extent(getDeckLayout(side, 8).boards, 2);
      return (z0 + z1) / 2;
    };
    expect(middle(1)).toBeCloseTo(DECK_SLIDE);
    expect(middle(-1)).toBeCloseTo(-DECK_SLIDE);
    // its inner middle post in front of the first mullion out from the middle
    const [mullion] = getPaneJoints();
    const posts = getDeckLayout(1, 8).frame.filter(isPost);
    expect(posts.map(({ position }) => position[2])).toContainEqual(
      expect.closeTo(mullion),
    );
  });
});

describe("deck stair", () => {
  const points = (triangles: Point[][]) => triangles.flat();
  const range = (values: number[]) => [
    Math.min(...values),
    Math.max(...values),
  ];
  const halfWidth = 8;
  const inner = halfWidth + END_WALL_FACE;
  const deckEnd = DECK.length / 2 + DECK_SLIDE;
  // Along the home, toward the end the deck slides to
  const along = (side: -1 | 1, [z0, z1]: number[]) =>
    [side * z0, side * z1].sort((a, b) => a - b);
  const overlap = (a: DeckBox, b: DeckBox) =>
    [0, 1, 2].every((axis) => {
      const [a0, a1] = extent([a], axis);
      const [b0, b1] = extent([b], axis);
      return Math.min(a1, b1) - Math.max(a0, b0) > 1e-6;
    });

  it.each([-1, 1] as const)(
    "steps down from the deck's edge past the home, along its end wall, side %i",
    (side) => {
      const { treads, stringers } = getDeckLayout(side, halfWidth);
      // as wide as the deck past the home's end wall, stringers and all
      const [c0, c1] = along(
        side,
        range(points(stringers).map(([, , z]) => z)),
      );
      expect(c0).toBeCloseTo(HOME_END);
      expect(c1).toBeCloseTo(deckEnd);
      const [t0, t1] = along(side, extent(treads, 2));
      expect(t0).toBeGreaterThan(c0);
      expect(t1).toBeLessThan(c1);
      // running in from the deck's inner edge, under the home's glass side
      const [x0, x1] = extent(treads, 0)
        .map((x) => side * x)
        .sort((a, b) => a - b);
      expect(x1).toBeCloseTo(inner);
      expect(x0).toBeLessThan(inner);
      // equal risers, the deck's boards the top step and the ground the last
      const tops = Array.from(new Set(treads.map((t) => top(t).toFixed(6))))
        .map(Number)
        .sort((a, b) => b - a);
      expect(tops).toHaveLength(DECK_STAIR.risers - 1);
      const rise = (FLOOR - MODEL_BASE) / DECK_STAIR.risers;
      [...tops, MODEL_BASE].forEach((y, i, steps) =>
        expect((i === 0 ? FLOOR : steps[i - 1]) - y).toBeCloseTo(rise),
      );
      // two boards a tread, running across the stair
      expect(treads).toHaveLength(2 * (DECK_STAIR.risers - 1));
      treads.forEach(({ size }) => expect(size[2]).toBeCloseTo(t1 - t0));
    },
  );

  it.each([-1, 1] as const)(
    "is clear of the deck's stem walls and frame, side %i",
    (side) => {
      const { treads, foundation, frame } = getDeckLayout(side, halfWidth);
      const clashes = treads.flatMap((tread) =>
        [...foundation, ...frame].filter((part) => overlap(tread, part)),
      );
      expect(clashes).toEqual([]);
    },
  );

  it.each([-1, 1] as const)(
    "carries the treads on stringers from the deck to the ground, side %i",
    (side) => {
      const { treads, stringers } = getDeckLayout(side, halfWidth);
      const corners = points(stringers);
      const [y0, y1] = range(corners.map(([, y]) => y));
      // level with the deck's floor at the top
      expect(y0).toBeCloseTo(MODEL_BASE);
      expect(y1).toBeCloseTo(FLOOR);
      // either side of the treads, meeting their ends
      const [t0, t1] = extent(treads, 2);
      const zs = corners.map(([, , z]) => z);
      expect(zs.filter((z) => z > t0 + 1e-6 && z < t1 - 1e-6)).toEqual([]);
      expect(zs).toContainEqual(expect.closeTo(t0));
      expect(zs).toContainEqual(expect.closeTo(t1));
      // from the deck's edge to past the last tread
      const [x0, x1] = range(corners.map(([x]) => side * x));
      const [tx0] = extent(treads, 0)
        .map((x) => side * x)
        .sort((a, b) => a - b);
      expect(x1).toBeCloseTo(inner);
      expect(x0).toBeLessThan(tx0);
      // its toe chamfered off: an upright end, from the ground up a little
      // way, not a point
      const toeHeights = corners
        .filter(([x]) => Math.abs(side * x - x0) < 1e-6)
        .map(([, y]) => y);
      const [toe0, toe1] = range(toeHeights);
      expect(toe0).toBeCloseTo(MODEL_BASE);
      expect(toe1 - toe0).toBeGreaterThan(0.1);
      expect(toe1).toBeLessThan(FLOOR - (FLOOR - MODEL_BASE) / 2);
      // every face turned out, from the middle of its stringer
      const stringerOf = (triangle: Point[]) =>
        triangle[0][2] < (t0 + t1) / 2 ? 0 : 1;
      const middles = [0, 1].map((s) => {
        const own = points(stringers.filter((t) => stringerOf(t) === s));
        return [0, 1, 2].map(
          (axis) => own.reduce((sum, p) => sum + p[axis], 0) / own.length,
        );
      });
      stringers.forEach((triangle) => {
        const normal = getNormal(triangle);
        const middle = middles[stringerOf(triangle)];
        const out = [0, 1, 2].map(
          (axis) =>
            (triangle[0][axis] + triangle[1][axis] + triangle[2][axis]) / 3 -
            middle[axis],
        );
        expect(
          normal.reduce((sum, n, axis) => sum + n * out[axis], 0),
        ).toBeGreaterThan(0);
      });
    },
  );
});

describe("box geometry", () => {
  it("draws 12 triangles per box, facing out", () => {
    const box: DeckBox = { position: [1, 2, 3], size: [2, 4, 6] };
    const { positions, normals } = getBoxesGeometry([box, box]);
    expect(positions).toHaveLength(2 * 36 * 3);
    expect(normals).toHaveLength(positions.length);
    for (let t = 0; t < positions.length; t += 9) {
      const [a, b, c] = [0, 3, 6].map((o) =>
        Array.from(positions.slice(t + o, t + o + 3)),
      );
      const u = b.map((v, i) => v - a[i]);
      const v = c.map((w, i) => w - a[i]);
      const cross = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      const normal = Array.from(normals.slice(t, t + 3));
      // wound counter-clockwise round the normal, on the box's face
      expect(
        cross.reduce((sum, x, i) => sum + x * normal[i], 0),
      ).toBeGreaterThan(0);
      const axis = normal.findIndex((n) => n !== 0);
      expect(a[axis]).toBe(
        box.position[axis] + (normal[axis] * box.size[axis]) / 2,
      );
    }
  });
});

describe("deck drop", () => {
  it("lowers a deck from overhead to its place", () => {
    expect(getDeckOffset("dropping", DECK_DROP.height, 0)).toBe(
      DECK_DROP.height,
    );
    const halfway = getDeckOffset(
      "dropping",
      DECK_DROP.height,
      DECK_DROP.duration / 2,
    );
    // fast at first, then set down gently
    expect(halfway).toBeLessThan(DECK_DROP.height / 2);
    expect(halfway).toBeGreaterThan(0);
    expect(
      getDeckOffset("dropping", DECK_DROP.height, DECK_DROP.duration),
    ).toBe(0);
  });

  it("hoists a deck away slowly at first", () => {
    const halfway = getDeckOffset("lifting", 0, DECK_DROP.duration / 2);
    expect(halfway).toBeLessThan(DECK_DROP.height / 2);
    expect(getDeckOffset("lifting", 0, DECK_DROP.duration)).toBe(
      DECK_DROP.height,
    );
  });

  it("turns back from partway in the time the rest of the way takes", () => {
    const from = DECK_DROP.height / 4;
    expect(getDeckOffset("dropping", from, DECK_DROP.duration / 4)).toBe(0);
    expect(getDeckOffset("landed", from, 0)).toBe(0);
  });
});

describe("deck stem wall", () => {
  it("rises to meet the deck as it's lowered, and sinks as it's lifted", () => {
    expect(getFoundationRise(DECK_DROP.height)).toBe(0);
    expect(getFoundationRise(DECK_DROP.height / 4)).toBeCloseTo(0.75);
    expect(getFoundationRise(0)).toBe(1);
    expect(getFoundationRise(DECK_DROP.height * 2)).toBe(0);
  });
});

describe("deck state", () => {
  it("adds a deck to a side, and lifts it away again", () => {
    const added = toggleDeck({}, 1);
    expect(added).toEqual({ 1: "dropping" });
    const landed = settleDeck(added, 1);
    expect(landed).toEqual({ 1: "landed" });
    const lifting = toggleDeck(landed, 1);
    expect(lifting).toEqual({ 1: "lifting" });
    expect(settleDeck(lifting, 1)).toEqual({});
  });

  it("keeps each side's deck to itself", () => {
    const both = toggleDeck(settleDeck(toggleDeck({}, 1), 1), -1);
    expect(both).toEqual({ 1: "landed", [-1]: "dropping" });
  });

  it("lands every deck at once, and drops ones on their way out", () => {
    expect(landDecks({ 1: "dropping", [-1]: "lifting" })).toEqual({
      1: "landed",
    });
  });

  it("knows when a deck is moving, so the ground shadow can follow it", () => {
    expect(isDeckMoving({})).toBe(false);
    expect(isDeckMoving({ 1: "landed", [-1]: "landed" })).toBe(false);
    expect(isDeckMoving({ 1: "landed", [-1]: "dropping" })).toBe(true);
    expect(isDeckMoving({ 1: "lifting" })).toBe(true);
  });

  it("widens the footprint by a deck's depth from when it's added", () => {
    expect(getDecksWidth({})).toBe(0);
    expect(getDecksWidth({ 1: "dropping" })).toBe(DECK.depth);
    expect(getDecksWidth({ 1: "landed", [-1]: "landed" })).toBe(2 * DECK.depth);
    expect(getDecksWidth({ 1: "landed", [-1]: "lifting" })).toBe(DECK.depth);
  });

  it("lengthens the footprint by each deck's slide past the home", () => {
    expect(getDecksLength({})).toBe(0);
    expect(getDecksLength({ 1: "dropping" })).toBe(Math.round(DECK_SLIDE));
    expect(getDecksLength({ 1: "landed", [-1]: "landed" })).toBe(
      Math.round(2 * DECK_SLIDE),
    );
  });

  it("knows which glass side faces the camera", () => {
    expect(getFacingSide(60)).toBe(1);
    expect(getFacingSide(-0.5)).toBe(-1);
  });
});

describe("deck toggle", () => {
  it("adds a deck on the side facing the camera, or removes the one there", () => {
    const facing = createFacingStore(1);
    const onToggle = jest.fn();
    const { rerender } = render(
      <DeckToggle decks={{}} facing={facing} onToggle={onToggle} />,
    );
    const button = screen.getByRole("button", { name: "Deck on this side" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(onToggle).toHaveBeenLastCalledWith(1);

    rerender(
      <DeckToggle
        decks={{ 1: "landed" }}
        facing={facing}
        onToggle={onToggle}
      />,
    );
    expect(button).toHaveAttribute("aria-pressed", "true");

    // orbiting round to the other side, which has no deck
    act(() => facing.set(-1));
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(onToggle).toHaveBeenLastCalledWith(-1);
  });

  it("offers a deck again on a side whose deck is lifting away", () => {
    render(
      <DeckToggle
        decks={{ 1: "lifting" }}
        facing={createFacingStore(1)}
        onToggle={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Deck on this side" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
