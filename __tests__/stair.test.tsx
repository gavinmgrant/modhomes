import {
  COLUMN_FACE,
  getOpeningParts,
  getRailing,
  getRailPostTreads,
  getStairLayout,
  getTreads,
  LINING,
  RAIL_HEIGHT,
  UPSTAIRS_WALL,
} from "../components/stair";
import { getSlabPieces } from "../components/module";

describe("stair", () => {
  it("climbs 10 ft in 16 even risers of 7.5 inches", () => {
    const treads = getTreads();
    expect(treads).toHaveLength(15);
    const rises = treads.map((t, i) => t.y - (i ? treads[i - 1].y : -3.95));
    rises.forEach((rise) => expect(rise * 12).toBeCloseTo(7.5));
    // the last riser reaches the upper floor
    expect(6.05 - treads[treads.length - 1].y).toBeCloseTo(10 / 16);
  });

  it.each([2, 3, 4])(
    "is 3'-6\" wide and its opening fits inside the first module (%i modules wide)",
    (cols) => {
      const { moduleX, footprint, opening } = getStairLayout(cols);
      expect((footprint.x[1] - footprint.x[0]) * 12).toBeCloseTo(42);
      // the opening is wider than the stair on both sides
      expect(opening.x[0]).toBeLessThan(footprint.x[0]);
      expect(opening.x[1]).toBeGreaterThan(footprint.x[1]);
      // inside the module's floor, short of the columns at its edge
      expect(opening.x[0]).toBeGreaterThan(moduleX - 3.875);
      expect(opening.x[1]).toBeLessThanOrEqual(moduleX + COLUMN_FACE);
      // clear of the middle column, with 6-7 ft between the bottom step and
      // the end wall's inner face
      expect(footprint.z[0]).toBeGreaterThan(0.25);
      const clearance = 19.5 - footprint.z[1];
      expect(clearance).toBeGreaterThanOrEqual(6);
      expect(clearance).toBeLessThanOrEqual(7);
    }
  );

  it("lands every tread inside its footprint", () => {
    const { footprint } = getStairLayout(2);
    getTreads().forEach(({ z }) => {
      expect(z).toBeGreaterThan(footprint.z[0]);
      expect(z).toBeLessThan(footprint.z[1]);
    });
  });
});

describe("stair opening", () => {
  const { opening } = getStairLayout(2);
  const { lining, walls } = getOpeningParts(opening);
  const span = (box: (typeof lining)[number], axis: number) => [
    box.position[axis] - box.size[axis] / 2,
    box.position[axis] + box.size[axis] / 2,
  ];

  it("lines all four faces with 1 inch boards from ceiling to upper floor", () => {
    expect(lining).toHaveLength(4);
    lining.forEach((board) => {
      expect(Math.min(board.size[0], board.size[2]) * 12).toBeCloseTo(1);
      const [bottom, top] = span(board, 1);
      expect(bottom).toBeCloseTo(3.85);
      expect(top).toBeCloseTo(6.05);
    });
  });

  it("walls three sides upstairs at 42 inches, open where the stair arrives", () => {
    expect(walls).toHaveLength(3);
    walls.forEach((wall) => {
      expect(wall.size[1] * 12).toBeCloseTo(42);
      expect(span(wall, 1)[0]).toBeCloseTo(6.05);
      // nothing crosses the top end of the opening, where the stair arrives
      expect(span(wall, 2)[0]).toBeGreaterThanOrEqual(opening.z[0] - 1e-9);
    });
    const crossing = walls.filter((wall) => wall.size[0] > 1);
    expect(crossing).toHaveLength(1);
    expect(crossing[0].position[2]).toBeGreaterThan(opening.z[1] - 1);
  });

  it("keeps the upstairs wall flush with the lining's inner face", () => {
    const [left, right] = walls;
    expect(span(left, 0)[1]).toBeCloseTo(opening.x[0] + LINING);
    expect(span(right, 0)[0]).toBeCloseTo(opening.x[1] - LINING);
    expect(left.size[0]).toBeCloseTo(UPSTAIRS_WALL.thickness);
  });
});

describe("slab openings", () => {
  const area = (pieces: ReturnType<typeof getSlabPieces>) =>
    pieces.reduce((sum, p) => sum + p.width * p.depth, 0);

  it("keeps a slab whole with no opening", () => {
    expect(getSlabPieces(8, 40)).toEqual([{ x: 0, z: 0, width: 8, depth: 40 }]);
  });

  it("leaves exactly the hole uncovered", () => {
    const hole = {
      x: [-1.125, 3.375] as [number, number],
      z: [5, 17.5] as [number, number],
    };
    const pieces = getSlabPieces(8, 40, hole);
    expect(area(pieces)).toBeCloseTo(8 * 40 - 4.5 * 12.5);
    // no piece covers the middle of the hole
    pieces.forEach((p) => {
      const coversX = Math.abs(1.125 - p.x) < p.width / 2;
      const coversZ = Math.abs(11.25 - p.z) < p.depth / 2;
      expect(coversX && coversZ).toBe(false);
    });
  });
});

describe("cable railing", () => {
  const treads = getTreads();
  const { posts, cap, cables } = getRailing(0);
  const angle = cap.rotation[0];
  // Top and bottom of a sloped box, measured vertically at its centre
  const verticalHalf = (box: typeof cap) => box.size[1] / 2 / Math.cos(angle);

  it("posts on the bottom and top steps, under 4 ft apart", () => {
    const postTreads = getRailPostTreads();
    expect(postTreads[0]).toBe(0);
    expect(postTreads[postTreads.length - 1]).toBe(treads.length - 1);
    for (let i = 1; i < posts.length; i++) {
      const span = Math.abs(posts[i].position[2] - posts[i - 1].position[2]);
      expect(span).toBeLessThan(4);
    }
    // each post stands on its tread
    posts.forEach((post, i) => {
      const bottom = post.position[1] - post.size[1] / 2;
      expect(bottom).toBeCloseTo(treads[postTreads[i]].y);
    });
  });

  it("tops the wood cap 36 inches above the nosing line", () => {
    expect(RAIL_HEIGHT * 12).toBeCloseTo(36);
    const capTop = cap.position[1] + verticalHalf(cap);
    // the cap's centre sits over the middle of the flight, where the nosing
    // line runs halfway between the bottom and top post treads
    const postTreads = getRailPostTreads();
    const nosingAtCentre =
      (treads[postTreads[0]].y + treads[postTreads[postTreads.length - 1]].y) /
      2;
    expect(capTop - nosingAtCentre).toBeCloseTo(RAIL_HEIGHT, 1);
  });

  it("runs cables no more than 3 inches apart from the bottom post to the top", () => {
    expect(cables.length).toBeGreaterThanOrEqual(8);
    const heights = cables.map((c) => c.position[1]).sort((a, b) => a - b);
    for (let i = 1; i < heights.length; i++) {
      expect((heights[i] - heights[i - 1]) * 12).toBeLessThanOrEqual(3.01);
    }
    const reach = cables[0].size[2] * Math.cos(angle);
    const postSpan = Math.abs(
      posts[0].position[2] - posts[posts.length - 1].position[2]
    );
    expect(reach).toBeCloseTo(postSpan);
  });

  it("starts the cables 4.6 inches up and keeps them clear of the cap", () => {
    // Cables, like the cap, are centred over the middle of the flight
    const postTreads = getRailPostTreads();
    const nosingAtCentre =
      (treads[postTreads[0]].y + treads[postTreads[postTreads.length - 1]].y) /
      2;
    const [lowest, highest] = [cables[0], cables[cables.length - 1]];
    expect((lowest.position[1] - nosingAtCentre) * 12).toBeCloseTo(4.6, 1);
    const capBottom = cap.position[1] - verticalHalf(cap);
    expect(highest.position[1] + verticalHalf(highest)).toBeLessThan(capBottom);
  });

  it("sits inside the stair's width on both sides", () => {
    const { footprint } = getStairLayout(2);
    footprint.x.forEach((edge, side) => {
      const x = edge + (side === 0 ? 0.15 : -0.15);
      getRailing(x).posts.forEach((post) => {
        expect(post.position[0] - post.size[0] / 2).toBeGreaterThan(
          footprint.x[0]
        );
        expect(post.position[0] + post.size[0] / 2).toBeLessThan(
          footprint.x[1]
        );
      });
    });
  });
});
