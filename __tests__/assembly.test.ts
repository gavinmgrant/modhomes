import { PerspectiveCamera, Vector3 } from "three";
import {
  ASSEMBLY_EXTENTS,
  CAMERA_HEIGHT,
  getAssemblyCamera,
} from "../components/assembly";
import { getParapetTop } from "../lib/dimensions";

const FOV = 30;

// Every corner of what has to stay in frame, turned with the home, as three
// projects it for a camera at `across` and `height`, looking at the centre
const projectCorners = (aspect: number, across: number, height: number) => {
  const camera = new PerspectiveCamera(FOV, aspect);
  camera.position.set(0, height, across);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const corners = ASSEMBLY_EXTENTS.flatMap(({ x, y, z }) =>
    x.flatMap((cx) => y.flatMap((cy) => z.map((cz) => [cx, cy, cz]))),
  );
  return Array.from({ length: 360 }, (_, degree) =>
    corners.map(([x, y, z]) =>
      new Vector3(x, y, z)
        .applyAxisAngle(new Vector3(0, 1, 0), (degree * Math.PI) / 180)
        .project(camera),
    ),
  ).flat();
};

describe("hero camera", () => {
  it("sits 50 ft above the parapets, looking down at the home", () => {
    const { across, height } = getAssemblyCamera(1, FOV);
    expect(height).toBe(CAMERA_HEIGHT);
    expect(height - getParapetTop(1)).toBe(50);
    expect(across).toBeGreaterThan(0);
  });

  it.each([0.5, 0.75, 1, 1.5, 2, 3])(
    "keeps every piece in frame as the home turns (aspect %f)",
    (aspect) => {
      const { across, height } = getAssemblyCamera(aspect, FOV);
      projectCorners(aspect, across, height).forEach(({ x, y, z }) => {
        expect(Math.abs(x)).toBeLessThan(1);
        expect(Math.abs(y)).toBeLessThan(1);
        expect(z).toBeLessThan(1);
      });
      // and sits no further back than it needs to: a little nearer, and
      // something would reach the edge of the frame
      const nearer = projectCorners(aspect, across * 0.9, height);
      const reach = Math.max(
        ...nearer.map(({ x, y }) => Math.max(Math.abs(x), Math.abs(y))),
      );
      expect(reach).toBeGreaterThan(1 / 1.05);
    },
  );
});
