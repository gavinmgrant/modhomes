import {
  getModelSize,
  getOrbitMinDistance,
  parseModel,
} from "../components/homemodel";
import MODELS from "../lib/models";

describe("homemodel", () => {
  it("stops the outside view zooming in before it reaches any model", () => {
    MODELS.forEach(({ slug }) => {
      const { cols, stories } = parseModel(slug)!;
      const { width, depth, height } = getModelSize(cols, stories);
      const corner = Math.hypot(width / 2, depth / 2, height / 2);
      const minDistance = getOrbitMinDistance(cols, stories);
      expect(minDistance).toBeGreaterThan(corner);
      // and the view still opens from its usual spot, 60 ft out on x and z
      expect(Math.hypot(60, 60)).toBeGreaterThan(minDistance);
    });
  });
});
