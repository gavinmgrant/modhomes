import {
  EYE_HEIGHT,
  getModelSize,
  getOrbitMinDistance,
  getOrbitTargetY,
  parseModel,
} from "../components/homemodel";
import { FINISHED_FLOOR, MODEL_BASE } from "../lib/dimensions";
import MODELS from "../lib/models";

describe("homemodel", () => {
  it("stops the outside view zooming in before it reaches any model", () => {
    MODELS.forEach(({ slug }) => {
      const { cols, stories } = parseModel(slug)!;
      const { width, depth, height } = getModelSize(cols, stories);
      // from the orbit target, to the box's farthest corner from it
      const target = getOrbitTargetY(stories);
      const corner = Math.hypot(
        width / 2,
        depth / 2,
        Math.max(height / 2 - target, height / 2 + target),
      );
      const minDistance = getOrbitMinDistance(cols, stories);
      expect(minDistance).toBeGreaterThan(corner);
      // and the view still opens from its usual spot, 60 ft out on x and z
      expect(Math.hypot(60, 60)).toBeGreaterThan(minDistance);
    });
  });

  it.each([1, 2])(
    "aims the outside view 6 ft above the ground floor, %i stories",
    (stories) => {
      const { height } = getModelSize(1, stories);
      // the stage centres the box, so the ground is half its height down
      const ground = -height / 2;
      expect(getOrbitTargetY(stories) - ground).toBeCloseTo(
        FINISHED_FLOOR + EYE_HEIGHT - MODEL_BASE,
      );
    },
  );
});
