import { getFrameReach, getPreviewDistance } from "../components/modelpreviews";
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
});
