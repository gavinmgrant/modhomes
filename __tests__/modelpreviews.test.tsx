import {
  easeToStart,
  getFrameReach,
  getPreviewDistance,
} from "../components/modelpreviews";
import { parseModel } from "../components/homemodel";
import MODELS from "../lib/models";

// desktop cards are roughly 250x168, phone cards 343x168
const ASPECTS = [1.5, 2];

describe("model previews", () => {
  it.each(MODELS.map((model) => model.slug))(
    "keeps %s in frame through a full turn",
    (slug) => {
      const { cols, stories } = parseModel(slug)!;
      ASPECTS.forEach((aspect) => {
        const distance = getPreviewDistance(cols, stories, aspect);
        const reach = getFrameReach(cols, stories, aspect, distance);
        // inside the frame with a margin, but not zoomed out more than needed
        expect(reach).toBeLessThanOrEqual(0.88);
        expect(reach).toBeGreaterThan(0.87);
      });
    }
  );

  it("needs to sit further back from taller models", () => {
    expect(getPreviewDistance(2, 2, 1.5)).toBeGreaterThan(
      getPreviewDistance(2, 1, 1.5)
    );
  });

  describe("returning to the start after hover", () => {
    const settle = (angle: number) => {
      let frames = 0;
      while (angle !== 0 && frames < 600) {
        angle = easeToStart(angle, 1 / 60);
        frames++;
      }
      return { angle, seconds: frames / 60 };
    };

    it("eases back to exactly the starting angle within a second or so", () => {
      [0.5, Math.PI / 2, 3, 5.2, 2 * Math.PI * 3 + 1].forEach((start) => {
        const { angle, seconds } = settle(start);
        expect(angle).toBe(0);
        expect(seconds).toBeLessThan(1.5);
      });
    });

    it("takes the short way round", () => {
      // a quarter turn unwinds backwards
      expect(easeToStart(Math.PI / 2, 1 / 60)).toBeLessThan(Math.PI / 2);
      expect(easeToStart(Math.PI / 2, 1 / 60)).toBeGreaterThan(0);
      // most of a turn finishes forwards instead of unwinding
      const nearlyFull = (300 * Math.PI) / 180;
      const next = easeToStart(nearlyFull, 1 / 60);
      expect(next).toBeLessThan(0);
      expect(next).toBeGreaterThan(-Math.PI / 3);
    });
  });
});
