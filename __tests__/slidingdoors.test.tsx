import {
  ENTER_DURATION,
  getEntranceDelays,
  getEntranceProgress,
  getHeaderLayout,
  getPaneLayout,
  PANES_PER_HALF,
} from "../components/slidingdoors";
import { getWalkBounds } from "../components/walkcontrols";

describe("sliding doors", () => {
  it("puts three panes either side of the middle column on each story", () => {
    expect(getPaneLayout(-1, 8, 1)).toHaveLength(2 * PANES_PER_HALF);
    expect(getPaneLayout(1, 8, 2)).toHaveLength(4 * PANES_PER_HALF);
  });

  it("gives every pane its own id so each can be animated", () => {
    const ids = [...getPaneLayout(-1, 12, 2), ...getPaneLayout(1, 12, 2)].map(
      (pane) => pane.id
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fills the opening from the middle column to the end wall", () => {
    const panes = getPaneLayout(1, 8, 1);
    const front = panes.filter((pane) => pane.position[2] > 0);
    const back = panes.filter((pane) => pane.position[2] < 0);
    const near = (half: typeof panes) =>
      Math.min(...half.map((p) => Math.abs(p.position[2]) - p.width / 2));
    const far = (half: typeof panes) =>
      Math.max(...half.map((p) => Math.abs(p.position[2]) + p.width / 2));

    [front, back].forEach((half) => {
      expect(half).toHaveLength(PANES_PER_HALF);
      expect(near(half)).toBeCloseTo(0);
      expect(far(half)).toBeCloseTo(19.25);
    });
  });

  it("alternates tracks so neighbouring panes overlap like sliding doors", () => {
    const front = getPaneLayout(1, 8, 1).filter((p) => p.position[2] > 0);
    for (let i = 1; i < front.length; i++) {
      const [a, b] = [front[i - 1], front[i]];
      expect(a.position[0]).not.toBeCloseTo(b.position[0]);
      const gap = b.position[2] - b.width / 2 - (a.position[2] + a.width / 2);
      expect(gap).toBeCloseTo(-0.08);
    }
  });

  it("stacks upper story panes 10 units above the ground floor", () => {
    const panes = getPaneLayout(-1, 8, 2);
    const heights = Array.from(new Set(panes.map((p) => p.position[1])));
    expect(heights).toHaveLength(2);
    expect(heights[1] - heights[0]).toBeCloseTo(10);
  });

  it("sits outside the area visitors can walk in", () => {
    [1, 2, 3, 4, 5].forEach((cols) => {
      const { maxX } = getWalkBounds(cols);
      [-1, 1].forEach((side) => {
        getPaneLayout(side, 4 * cols, 1).forEach((pane) => {
          expect(Math.abs(pane.position[0])).toBeGreaterThan(maxX);
        });
      });
    });
  });

  describe("header", () => {
    it.each([1, 2])(
      "fills from the top story's doors up to the end wall beam (%i stories)",
      (stories) => {
        const header = getHeaderLayout(1, 8, stories);
        const panes = getPaneLayout(1, 8, stories);
        const doorTop = Math.max(
          ...panes.map((pane) => pane.position[1] + pane.height / 2)
        );
        const bottom = header.position[1] - header.size[1] / 2;
        const top = header.position[1] + header.size[1] / 2;
        expect(bottom).toBeCloseTo(doorTop);
        expect(top).toBeCloseTo(4.5 + 10 * (stories - 1));
      }
    );

    it("runs the full length of the doors", () => {
      const header = getHeaderLayout(-1, 8, 1);
      const reach = Math.max(
        ...getPaneLayout(-1, 8, 1).map(
          (pane) => Math.abs(pane.position[2]) + pane.width / 2
        )
      );
      expect(header.size[2] / 2).toBeCloseTo(reach);
    });

    it("sits 2-4 inches back from the end wall's outer face", () => {
      [-1, 1].forEach((side) => {
        const header = getHeaderLayout(side, 8, 1);
        const outerFace = Math.abs(header.position[0]) + header.size[0] / 2;
        const inset = (8 + 0.55 - outerFace) * 12;
        expect(inset).toBeGreaterThanOrEqual(2);
        expect(inset).toBeLessThanOrEqual(4);
      });
    });
  });

  describe("entrance animation", () => {
    it("slides panes in from one end of the wall to the other, half a second apart", () => {
      const panes = getPaneLayout(1, 4, 1);
      const delays = getEntranceDelays(panes);
      const byDelay = [...panes].sort(
        (a, b) => (delays.get(a.id) ?? 0) - (delays.get(b.id) ?? 0)
      );
      expect(byDelay.map((pane) => delays.get(pane.id))).toEqual([
        0, 0.5, 1, 1.5, 2, 2.5,
      ]);
      for (let i = 1; i < byDelay.length; i++) {
        expect(byDelay[i].position[2]).toBeGreaterThan(
          byDelay[i - 1].position[2]
        );
      }
    });

    it("can hold the first pane back until later in an assembly", () => {
      const panes = getPaneLayout(1, 4, 1);
      const delays = Array.from(getEntranceDelays(panes, 4).values()).sort();
      expect(delays).toEqual([4, 4.5, 5, 5.5, 6, 6.5]);
    });

    it("holds each pane out until its turn, then eases it fully into place", () => {
      expect(getEntranceProgress(0, 1)).toBe(0);
      expect(getEntranceProgress(1, 1)).toBe(0);
      const midway = getEntranceProgress(1 + ENTER_DURATION / 2, 1);
      expect(midway).toBeGreaterThan(0.5);
      expect(midway).toBeLessThan(1);
      expect(getEntranceProgress(1 + ENTER_DURATION, 1)).toBe(1);
      expect(getEntranceProgress(100, 1)).toBe(1);
    });
  });
});
