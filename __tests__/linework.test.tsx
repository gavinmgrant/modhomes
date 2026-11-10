import { BoxGeometry, BufferAttribute, BufferGeometry } from "three";
import {
  emptyShape,
  overshootEdges,
  retraceShape,
} from "../components/linework";

describe("linework", () => {
  it("runs each line past its corners by a share of its length", () => {
    const out = overshootEdges([0, 0, 0, 1, 0, 0], 0.1, 1);
    expect(out[0]).toBeCloseTo(-0.1);
    expect(out[3]).toBeCloseTo(1.1);
  });

  it("runs a long line over by no more than the most it can", () => {
    const out = overshootEdges([0, 0, 0, 0, 10, 0], 0.1, 0.3);
    expect(Array.from(out).map((v) => +v.toFixed(5))).toEqual([
      0, -0.3, 0, 0, 10.3, 0,
    ]);
  });

  it("leaves a line with no length where it is", () => {
    expect(Array.from(overshootEdges([1, 2, 3, 1, 2, 3]))).toEqual([
      1, 2, 3, 1, 2, 3,
    ]);
  });
});

describe("a mesh's shape, for when its lines need tracing again", () => {
  const points = (n: number) => new BufferAttribute(new Float32Array(n * 3), 3);
  const traced = (geometry: BufferGeometry) => {
    const shape = emptyShape();
    retraceShape(shape, geometry);
    return shape;
  };

  it("is traced the first time it's seen", () => {
    expect(retraceShape(emptyShape(), new BoxGeometry())).toBe(true);
  });

  it("stays the same while nothing about it changes", () => {
    const geometry = new BoxGeometry();
    expect(retraceShape(traced(geometry), geometry)).toBe(false);
  });

  it("changes when the mesh is given new geometry", () => {
    const shape = traced(new BoxGeometry());
    expect(retraceShape(shape, new BoxGeometry(2, 2, 2))).toBe(true);
  });

  // As the roof and decks do when the home changes size
  it("changes when its geometry is given new points", () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", points(3));
    const shape = traced(geometry);
    geometry.setAttribute("position", points(6));
    expect(retraceShape(shape, geometry)).toBe(true);
  });

  it("changes when its points are moved where they are", () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", points(3));
    const shape = traced(geometry);
    geometry.getAttribute("position").needsUpdate = true;
    expect(retraceShape(shape, geometry)).toBe(true);
  });

  it("is up to date again once it's been retraced", () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", points(3));
    const shape = traced(geometry);
    geometry.setAttribute("position", points(6));
    retraceShape(shape, geometry);
    expect(retraceShape(shape, geometry)).toBe(false);
  });
});
