import {
  getModuleX,
  getRoomPlan,
  getRoomsLayout,
  getStairWalls,
  ROOM_JOINT,
  SHOWER_BATH_FRONT,
} from "../components/rooms";
import {
  END_FACE,
  getGalleyLayout,
  getServicesLayout,
  SIDE_INNER,
  WALL,
} from "../components/services";
import { DOOR_WIDTH, getHallBath } from "../components/bathroom";
import {
  CEILING,
  FLOOR,
  getFootprints,
  Part,
  POCKET,
} from "../components/fixtures";
import { getPaneJoints } from "../components/slidingdoors";
import { getStairLayout } from "../components/stair";
import {
  getWalkBounds,
  getWalkStart,
  isBlocked,
  WalkBounds,
} from "../components/walkcontrols";
import MODELS from "../lib/models";

const span = ({ position, size }: Part, axis: number) => [
  position[axis] - size[axis] / 2,
  position[axis] + size[axis] / 2,
];

const overlap = (a: number[], b: number[]) =>
  Math.min(a[1], b[1]) - Math.max(a[0], b[0]);

const isFullHeight = (part: Part) =>
  Math.abs(span(part, 1)[0] - FLOOR) < 1e-6 &&
  Math.abs(span(part, 1)[1] - CEILING) < 1e-6;

// The ground floor's walls standing already, in home coordinates
const servicesWalls = (cols: number): Part[] => {
  const layout = getServicesLayout(cols) ?? getGalleyLayout(cols);
  if (!layout) return [];
  return [...layout.walls, ...layout.leaves].map((part) => ({
    ...part,
    position: [
      part.position[0] + layout.moduleX,
      part.position[1],
      part.position[2],
    ],
  }));
};

// Every spot reachable from `start` in small steps, on a 1/4 ft grid
const GRID = 0.25;
const reachable = (bounds: WalkBounds, start: { x: number; z: number }) => {
  const key = (i: number, j: number) => `${i},${j}`;
  const seen = new Set<string>();
  const queue: [number, number][] = [
    [Math.round(start.x / GRID), Math.round(start.z / GRID)],
  ];
  seen.add(key(...queue[0]));
  while (queue.length) {
    const [i, j] = queue.pop()!;
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const [x, z] = [(i + di) * GRID, (j + dj) * GRID];
      if (
        Math.abs(x) > bounds.maxX ||
        Math.abs(z) > bounds.maxZ ||
        seen.has(key(i + di, j + dj)) ||
        isBlocked(bounds, x, z)
      ) {
        continue;
      }
      seen.add(key(i + di, j + dj));
      queue.push([i + di, j + dj]);
    }
  }
  return (x: number, z: number) =>
    seen.has(key(Math.round(x / GRID), Math.round(z / GRID)));
};

describe("room plans", () => {
  it("gives each model the bedrooms it lists", () => {
    MODELS.forEach(({ cols, stories, bedrooms = 0 }) => {
      expect(getRoomPlan(cols, stories).bedrooms).toHaveLength(bedrooms);
    });
  });

  it("stands every bedroom against the glass, in modules the home has", () => {
    MODELS.forEach(({ cols, stories }) => {
      getRoomPlan(cols, stories).bedrooms.forEach(({ modules, story }) => {
        expect(modules.includes(0) || modules.includes(cols - 1)).toBe(true);
        modules.forEach((m) => {
          expect(m).toBeGreaterThanOrEqual(0);
          expect(m).toBeLessThan(cols);
        });
        expect(story).toBeLessThan(stories);
      });
    });
  });

  it("stacks a bath upstairs in every two-story home", () => {
    MODELS.forEach(({ cols, stories }) => {
      const { upperBath } = getRoomPlan(cols, stories);
      expect(upperBath).toBe(
        stories === 1 ? null : cols === 2 ? "shower" : "hall",
      );
    });
  });

  it("makes bedrooms at least 7 ft across and 70 sq ft", () => {
    const length = END_FACE - ROOM_JOINT - WALL / 2;
    // a bedroom that builds its own side wall is narrowest
    const width = 4 + SIDE_INNER;
    expect(length).toBeGreaterThanOrEqual(7);
    expect(width).toBeGreaterThanOrEqual(7);
    expect(length * width).toBeGreaterThanOrEqual(70);
  });
});

describe("rooms layout", () => {
  it("meets the glass only where two panes meet", () => {
    const joints = [0, ...getPaneJoints()];
    MODELS.forEach(({ cols, stories }) => {
      getRoomsLayout(cols, stories).forEach(({ walls }) => {
        walls
          .filter((wall) => wall.size[0] > wall.size[2])
          .filter((wall) => {
            const [x0, x1] = span(wall, 0);
            return x0 < -4 * cols + 0.01 || x1 > 4 * cols - 0.01;
          })
          .forEach((wall) => {
            const z = Math.abs(wall.position[2]);
            expect(joints.some((joint) => Math.abs(z - joint) < 0.01)).toBe(
              true,
            );
          });
      });
    });
    expect(ROOM_JOINT).toBe(getPaneJoints()[0]);
  });

  it("keeps every wall within the home, floor to ceiling", () => {
    MODELS.forEach(({ cols, stories }) => {
      getRoomsLayout(cols, stories).forEach(({ walls }) => {
        walls.forEach((wall) => {
          const [x0, x1] = span(wall, 0);
          const [z0, z1] = span(wall, 2);
          expect(x0).toBeGreaterThanOrEqual(-4 * cols - 0.05);
          expect(x1).toBeLessThanOrEqual(4 * cols + 0.05);
          expect(z0).toBeGreaterThanOrEqual(-END_FACE - 1e-6);
          expect(z1).toBeLessThanOrEqual(END_FACE + 1e-6);
          expect(span(wall, 1)[1]).toBeCloseTo(CEILING);
        });
      });
    });
  });

  it("never builds a wall through another", () => {
    MODELS.forEach(({ cols, stories }) => {
      getRoomsLayout(cols, stories).forEach(({ story, walls, fixtures }) => {
        const others =
          story === 0 ? servicesWalls(cols) : getStairWalls(cols);
        const all = [...walls, ...others];
        walls.forEach((wall, i) => {
          [...all.slice(i + 1), ...fixtures].forEach((other) => {
            const volume = [0, 1, 2]
              .map((axis) => overlap(span(wall, axis), span(other, axis)))
              .every((o) => o > 1e-6);
            expect(volume).toBe(false);
          });
        });
      });
    });
  });

  it("hides each pocket door in a wall, all but its leading edge", () => {
    MODELS.forEach(({ cols, stories }) => {
      getRoomsLayout(cols, stories).forEach(({ walls, leaves }) => {
        leaves.forEach((leaf) => {
          const axis = leaf.size[0] > leaf.size[2] ? 0 : 2;
          const across = 2 - axis;
          const [l0, l1] = span(leaf, axis);
          expect(l1 - l0).toBeCloseTo(DOOR_WIDTH + POCKET.lap);
          // the full-height walls on its line, which the leaf runs into
          const line = walls.filter(
            (wall) =>
              isFullHeight(wall) &&
              overlap(span(wall, across), span(leaf, across)) >=
                POCKET.thickness - 1e-6,
          );
          const hidden = line
            .map((wall) => Math.max(0, overlap(span(wall, axis), [l0, l1])))
            .reduce((a, b) => a + b, 0);
          expect(hidden).toBeCloseTo(l1 - l0 - POCKET.show);
        });
      });
    });
  });

  it("keeps the upstairs rooms clear of the stair's opening", () => {
    MODELS.filter(({ stories }) => stories === 2).forEach(({ cols }) => {
      const { opening } = getStairLayout(cols);
      const upper = getRoomsLayout(cols, 2)[1];
      [...upper.walls, ...upper.fixtures].forEach((part) => {
        const crosses =
          overlap(span(part, 0), opening.x) > 1e-6 &&
          overlap(span(part, 2), opening.z) > 1e-6;
        expect(crosses).toBe(false);
      });
    });
  });

  it("builds walk-in closets only upstairs, against the glass and left empty", () => {
    MODELS.forEach(({ cols, stories }) => {
      getRoomsLayout(cols, stories).forEach(({ story, fixtures, closets }) => {
        // only bathroom fixtures: no wardrobes, shelves or rails
        fixtures.forEach((part) => {
          expect(part.finish === "walnut" && span(part, 1)[0] > FLOOR + 5).toBe(
            false,
          );
          expect(span(part, 1)[1]).toBeLessThan(CEILING - 0.5);
        });
        expect(closets).toBe(story === 0 ? 0 : cols === 2 ? 2 : 1);
      });
    });
  });

  it("lets you walk from the start into every ground floor bedroom", () => {
    MODELS.forEach(({ cols, stories }) => {
      const bounds = getWalkBounds(cols, stories);
      const start = getWalkStart(bounds);
      expect(isBlocked(bounds, start.x, start.z)).toBe(false);
      const canReach = reachable(bounds, start);
      getRoomPlan(cols, stories)
        .bedrooms.filter((room) => room.story === 0)
        .forEach((room) => {
          const x = getModuleX(cols, room.modules[0]);
          // the middle of the floor between the end wall and the cross wall
          const z = (room.end * END_FACE + room.end * ROOM_JOINT) / 2;
          expect(canReach(x, z)).toBe(true);
        });
    });
  });
});

describe("upstairs", () => {
  const twoStory = MODELS.filter(({ stories }) => stories === 2);

  // Walking the upper floor as the ground floor's walked, from the top of
  // the stair: around its walls, the bath's and the bedrooms', through
  // their doorways
  const upperBounds = (cols: number): WalkBounds => {
    const upper = getRoomsLayout(cols, 2)[1];
    const ground = getWalkBounds(cols, 2);
    return {
      ...ground,
      blocks: [
        getStairLayout(cols).opening,
        ...getFootprints([
          ...upper.walls,
          ...upper.fixtures,
          ...upper.leaves,
          ...getStairWalls(cols),
        ]),
      ],
    };
  };
  const stairTop = (cols: number) => {
    const { footprint } = getStairLayout(cols);
    return { x: (footprint.x[0] + footprint.x[1]) / 2, z: footprint.z[0] - 1 };
  };

  it("runs the stair's walls up to the ceiling", () => {
    twoStory.forEach(({ cols }) => {
      getStairWalls(cols).forEach((wall) => {
        expect(span(wall, 1)[0]).toBeCloseTo(FLOOR);
        expect(span(wall, 1)[1]).toBeCloseTo(CEILING);
      });
    });
  });

  it("reaches every bedroom and walk-in closet from the top of the stair", () => {
    twoStory.forEach(({ cols }) => {
      const bounds = upperBounds(cols);
      const start = stairTop(cols);
      expect(isBlocked(bounds, start.x, start.z)).toBe(false);
      const canReach = reachable(bounds, start);
      getRoomPlan(cols, 2)
        .bedrooms.filter((room) => room.story === 1)
        .forEach((room) => {
          const x = getModuleX(cols, room.modules[0]);
          const z = (room.end * END_FACE + room.end * ROOM_JOINT) / 2;
          expect(canReach(x, z)).toBe(true);
        });
      // the closet beyond the stair, in its module's front corner
      const closetX = -4 * cols + 1.5;
      expect(canReach(closetX, END_FACE - 1.5)).toBe(true);
      // and, in a 2x2, the one over the galley's closet
      if (cols === 2) expect(canReach(6, -END_FACE + 1.5)).toBe(true);
    });
  });

  it("opens the upstairs bath onto the hall, not a bedroom", () => {
    twoStory.forEach(({ cols }) => {
      const bounds = upperBounds(cols);
      const canReach = reachable(bounds, stairTop(cols));
      const upper = getRoomsLayout(cols, 2)[1];
      // the bath's leaf is the one beside its tiled floor
      const tiled = upper.fixtures.filter(({ finish }) => finish === "floorTile");
      expect(tiled.length).toBeGreaterThan(0);
      const bath = tiled[0];
      const [bx0, bx1] = span(bath, 0);
      const [bz0, bz1] = span(bath, 2);
      // a point just outside the bath, by its door, in the hall
      const door = upper.leaves.find((leaf) => {
        const [x0, x1] = span(leaf, 0);
        const [z0, z1] = span(leaf, 2);
        return (
          overlap([x0, x1], [bx0 - 0.5, bx1 + 0.5]) > -1e-6 &&
          overlap([z0, z1], [bz0 - 0.5, bz1 + 0.5]) > -1e-6
        );
      })!;
      expect(door).toBeDefined();
      const across = door.size[0] > door.size[2] ? 2 : 0;
      const centre = door.position;
      const outward =
        across === 2
          ? centre[2] > (bz0 + bz1) / 2
            ? 1
            : -1
          : centre[0] > (bx0 + bx1) / 2
            ? 1
            : -1;
      const out = [...centre];
      out[across] += outward * 1;
      expect(canReach(out[0], out[2])).toBe(true);
    });
    expect(SHOWER_BATH_FRONT).toBeLessThan(0);
  });
});

describe("hall bath", () => {
  const room = { x: [-3.5, 3.5], z: [-19.5, -6.6] } as {
    x: [number, number];
    z: [number, number];
  };
  const bath = getHallBath(room);

  it("leaves a 2'-6\" doorway in its front wall", () => {
    expect(bath.doorX[1] - bath.doorX[0]).toBeCloseTo(DOOR_WIDTH);
    expect(bath.doorX[1]).toBeLessThanOrEqual(room.x[1]);
  });

  it("keeps its fixtures inside its walls, clear of the doorway", () => {
    bath.parts.forEach((part) => {
      const [x0, x1] = span(part, 0);
      const [z0, z1] = span(part, 2);
      expect(x0).toBeGreaterThanOrEqual(room.x[0] - 1e-6);
      expect(x1).toBeLessThanOrEqual(room.x[1] + 1e-6);
      expect(z0).toBeGreaterThanOrEqual(room.z[0] - 1e-6);
      expect(z1).toBeLessThanOrEqual(room.z[1] + 1e-6);
      // nothing standing in the 3 ft inside the door
      if (span(part, 1)[0] < FLOOR + 1.5 && span(part, 1)[1] > FLOOR + 0.05) {
        const inWay =
          overlap([x0, x1], bath.doorX) > 1e-6 &&
          overlap([z0, z1], [room.z[1] - 3, room.z[1]]) > 1e-6;
        expect(inWay).toBe(false);
      }
    });
  });
});
