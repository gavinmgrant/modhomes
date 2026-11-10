import React, { ReactNode, useCallback, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  Color,
  DepthTexture,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  InterleavedBufferAttribute,
  LessDepth,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { INK } from "./panel";

// Faces meeting at more than this many degrees get a line between them, so
// a box is drawn at every corner while a cylinder's facets run smooth
const EDGE_ANGLE = 20;
// Each line runs a little past its corners, the way they're drawn by hand:
// a share of its length, up to a few inches. The share is kept small, so
// short pieces like trim only just run over, while the long edges of walls
// and floors run the full few inches
const OVERSHOOT = { share: 0.06, max: 0.3 };
// Two weights of line, as an architect draws them. An edge with space
// behind it, against the sky or standing off whatever's further back, is a
// profile, drawn heavy: this many pixels wide, wherever the depth behind it
// jumps by more than this share of how far away it is. Every other edge,
// a corner or a joint on a surface, is a crease, drawn as a hairline. It's
// already as narrow as a line can be drawn, a single pixel, so it's made
// finer by drawing it fainter
const PROFILE = { weight: 2, gap: 0.015, opacity: 0.9 };
const CREASE = { opacity: 0.2 };

// Every segment of a line drawing, lengthened at both ends by its share,
// up to the most it can run over. Points that meet stay where they are
export const overshootEdges = (
  positions: ArrayLike<number>,
  share = OVERSHOOT.share,
  max = OVERSHOOT.max,
) => {
  const out = Float32Array.from(positions);
  for (let i = 0; i + 5 < out.length; i += 6) {
    const d = [
      out[i + 3] - out[i],
      out[i + 4] - out[i + 1],
      out[i + 5] - out[i + 2],
    ];
    const length = Math.hypot(d[0], d[1], d[2]);
    if (length === 0) continue;
    const over = Math.min(max, length * share) / length;
    for (let axis = 0; axis < 3; axis++) {
      out[i + axis] -= d[axis] * over;
      out[i + 3 + axis] += d[axis] * over;
    }
  }
  return out;
};

const buildEdges = (geometry: BufferGeometry) => {
  // A mesh used only to group others has no shape to draw
  if (!geometry.getAttribute("position")) return new BufferGeometry();
  const edges = new EdgesGeometry(geometry, EDGE_ANGLE);
  const lines = new BufferGeometry();
  lines.setAttribute(
    "position",
    new Float32BufferAttribute(
      overshootEdges(edges.getAttribute("position").array),
      3,
    ),
  );
  edges.dispose();
  return lines;
};

// A finish pushed back a touch, so the lines along its edges are drawn over
// it rather than fighting it for the same depth. Every finish moves back
// alike, so they sit against each other as they did
const makeRoomForLines = (material: Material) => {
  if (material.polygonOffset) return;
  material.polygonOffset = true;
  material.polygonOffsetFactor = 1;
  material.polygonOffsetUnits = 1;
};

type Points = BufferAttribute | InterleavedBufferAttribute | null | undefined;

// An interleaved attribute keeps its version on the data it shares
const versionOf = (points: Points) =>
  points instanceof InterleavedBufferAttribute
    ? points.data.version
    : (points?.version ?? -1);

// What a mesh's lines were traced from. Some pieces, like the roof and the
// decks, keep their geometry and swap the points inside it as the home
// changes size, so the points and their versions count too, not just the
// geometry they're in
export interface Shape {
  geometry: BufferGeometry | null;
  position: Points;
  positionVersion: number;
  index: Points;
  indexVersion: number;
}

export const emptyShape = (): Shape => ({
  geometry: null,
  position: null,
  positionVersion: -1,
  index: null,
  indexVersion: -1,
});

// Brings a shape up to date with the geometry, in place, as it's asked of
// every mesh every frame, and says whether anything about it had changed
export const retraceShape = (shape: Shape, geometry: BufferGeometry) => {
  const position = geometry.getAttribute("position");
  const { index } = geometry;
  if (
    shape.geometry === geometry &&
    shape.position === position &&
    shape.positionVersion === versionOf(position) &&
    shape.index === index &&
    shape.indexVersion === versionOf(index)
  ) {
    return false;
  }
  shape.geometry = geometry;
  shape.position = position;
  shape.positionVersion = versionOf(position);
  shape.index = index;
  shape.indexVersion = versionOf(index);
  return true;
};

interface Traced {
  shape: Shape;
  lines: LineSegments;
  // The last frame its mesh was found in, so one that's gone is let go
  frame: number;
}

interface LineworkState {
  group: React.RefObject<Group>;
  // The light lines, kept out of the home's own scene, so nothing that
  // measures the home or draws its shadow counts them
  lines: Scene;
  traced: Map<Mesh, Traced>;
  pencil: LineBasicMaterial;
  frame: number;
}

// Every home with linework, in whichever canvas it's in, for drawLinework
// to find the ones in the scene it's drawing
const WORKS = new Set<LineworkState>();

const createState = (group: React.RefObject<Group>): LineworkState => {
  const lines = new Scene();
  // Each line takes where its mesh is, rather than working it out
  lines.matrixWorldAutoUpdate = false;
  return {
    group,
    lines,
    traced: new Map(),
    pencil: new LineBasicMaterial({
      color: INK,
      transparent: true,
      opacity: CREASE.opacity,
      toneMapped: false,
      // Where two pieces share an edge, only the first of their lines is
      // drawn, rather than both, one over the other, twice as dark
      depthFunc: LessDepth,
    }),
    frame: 0,
  };
};

const disposeState = (state: LineworkState) => {
  state.traced.forEach(({ lines }) => lines.geometry.dispose());
  state.traced.clear();
  state.lines.clear();
  state.pencil.dispose();
};

// Lines along the edges of everything inside it, over its own finishes.
// They're drawn by drawLinework, after the canvas draws its scene
const Linework = ({ children }: { children: ReactNode }) => {
  const invalidate = useThree((state) => state.invalidate);
  const group = useRef<Group>(null);
  const state = useRef<LineworkState | null>(null);

  // Made as it mounts and let go as it unmounts, so a remount, as React
  // does to every component in development, starts afresh
  useEffect(() => {
    const made = createState(group);
    state.current = made;
    WORKS.add(made);
    invalidate();
    return () => {
      WORKS.delete(made);
      disposeState(made);
      state.current = null;
      invalidate();
    };
  }, [invalidate]);

  // Before each frame, as meshes come and go and React can give one a new
  // shape or finish at any time
  useFrame(() => {
    const work = state.current;
    const root = group.current;
    if (!work || !root) return;
    const frame = ++work.frame;
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const { material } = object;
      if (Array.isArray(material)) material.forEach(makeRoomForLines);
      else makeRoomForLines(material);

      let traced = work.traced.get(object);
      if (!traced) {
        const lines = new LineSegments(undefined, work.pencil);
        lines.matrixAutoUpdate = false;
        work.lines.add(lines);
        traced = { shape: emptyShape(), lines, frame };
        work.traced.set(object, traced);
      }
      traced.frame = frame;
      if (retraceShape(traced.shape, object.geometry)) {
        traced.lines.geometry.dispose();
        traced.lines.geometry = buildEdges(object.geometry);
      }
    });
    work.traced.forEach((traced, mesh) => {
      if (traced.frame === frame) return;
      work.lines.remove(traced.lines);
      traced.lines.geometry.dispose();
      work.traced.delete(mesh);
    });
  });

  return <group ref={group}>{children}</group>;
};

export default Linework;

// Across each pixel, how much nearer it is than what's either side of it,
// as a share of its distance. Inverse depth runs evenly across a flat face
// however steeply it's seen, so a face comes to nothing and only a step in
// depth counts, on its near side: the edge in front. That's asked across
// pairs of points spread around the pixel, in six directions and out to
// the line's weight in three rings, and how many of them find a step is
// how much of the pixel the line covers. A pixel right on the edge finds
// one most ways, and one further in only across the outer rings, so the
// line fades off smoothly at its sides and rounds off at its ends, rather
// than stopping in steps a pixel at a time. A pixel with nothing of the
// home in it can't be in front of anything, so it's passed over at once
const PROFILE_SHADER = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D depth;
    uniform vec2 pixel;
    uniform float radius;
    uniform float near;
    uniform float far;
    uniform float gap;
    uniform vec3 ink;
    uniform float opacity;
    varying vec2 vUv;

    const int DIRECTIONS = 6;
    const int RINGS = 3;
    const float PI = 3.14159265;

    float nearness(float z) {
      z = z * 2.0 - 1.0;
      return (far + near - z * (far - near)) / (2.0 * near * far);
    }

    float nearnessAt(vec2 uv) {
      return nearness(texture2D(depth, uv).x);
    }

    void main() {
      float z = texture2D(depth, vUv).x;
      if (z >= 1.0) discard;
      float here = nearness(z);
      float found = 0.0;
      for (int d = 0; d < DIRECTIONS; d++) {
        float angle = float(d) * PI / float(DIRECTIONS);
        vec2 direction = vec2(cos(angle), sin(angle)) * pixel;
        for (int r = 1; r <= RINGS; r++) {
          vec2 offset = direction * radius * float(r) / float(RINGS);
          float jump =
            (2.0 * here - nearnessAt(vUv + offset) - nearnessAt(vUv - offset)) / here;
          found += smoothstep(gap, gap * 2.0, jump);
        }
      }
      float share = found / float(DIRECTIONS * RINGS);
      gl_FragColor = vec4(ink, opacity * smoothstep(0.1, 0.5, share));
    }
  `,
};

const createPass = () => {
  const target = new WebGLRenderTarget(1, 1);
  target.depthTexture = new DepthTexture(1, 1);
  const material = new ShaderMaterial({
    ...PROFILE_SHADER,
    uniforms: {
      depth: { value: target.depthTexture },
      pixel: { value: new Vector2() },
      radius: { value: PROFILE.weight },
      near: { value: 0.1 },
      far: { value: 1000 },
      gap: { value: PROFILE.gap },
      ink: { value: new Color(INK) },
      opacity: { value: PROFILE.opacity },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new PlaneGeometry(2, 2);
  const overlay = new Scene();
  overlay.add(new Mesh(quad, material));
  // The home drawn as nothing but depth, glass and all
  const solid = new MeshBasicMaterial({ side: DoubleSide, colorWrite: false });
  return {
    target,
    material,
    overlay,
    flat: new OrthographicCamera(),
    solid,
    viewport: new Vector4(),
    dispose: () => {
      target.depthTexture.dispose();
      target.dispose();
      material.dispose();
      quad.dispose();
      solid.dispose();
    },
  };
};

type LineworkPass = ReturnType<typeof createPass>;

// Hides everything in the scene but the linework and what holds it, and
// gives back what it hid
const hideAllBut = (scene: Scene, kept: Object3D[]) => {
  const holding = new Set<Object3D>();
  kept.forEach((object) => {
    for (let up = object.parent; up; up = up.parent) holding.add(up);
  });
  const hidden: Object3D[] = [];
  const visit = (object: Object3D) =>
    object.children.forEach((child) => {
      if (kept.includes(child)) return;
      if (holding.has(child)) visit(child);
      else if (child.visible) {
        child.visible = false;
        hidden.push(child);
      }
    });
  visit(scene);
  return hidden;
};

// Whether something is drawn in this scene: shown, and all that holds it
// shown, right up to the scene
const isDrawnIn = (scene: Scene, object: Object3D | null): boolean =>
  object === scene ||
  (!!object && object.visible && isDrawnIn(scene, object.parent));

// The lines over a view the renderer has just drawn, in the same viewport:
// the light ones along every edge, then the heavy ones wherever the depth
// steps back. For those, everything with linework is drawn once more on its
// own, as nothing but depth. Glass counts as solid, so what's behind it
// gets only the light lines
const drawLinework = (
  gl: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  pass: LineworkPass,
) => {
  const works: LineworkState[] = [];
  WORKS.forEach((work) => {
    if (isDrawnIn(scene, work.group.current)) works.push(work);
  });
  if (!works.length) return;

  // Each line where its mesh was just drawn, and only if it was. A mesh
  // that's hidden, or has been taken out of the scene even for a frame,
  // has nothing to draw lines for
  works.forEach(({ group, traced }) => {
    traced.forEach(({ lines }) => {
      lines.visible = false;
    });
    group.current?.traverseVisible((object) => {
      const lines = traced.get(object as Mesh)?.lines;
      if (!lines) return;
      lines.visible = true;
      lines.matrixWorld.copy(object.matrixWorld);
    });
  });

  const { target, material, overlay, flat, solid, viewport } = pass;
  gl.getCurrentViewport(viewport);
  if (target.width !== viewport.z || target.height !== viewport.w) {
    target.setSize(viewport.z, viewport.w);
  }
  const hidden = hideAllBut(
    scene,
    works.map(({ group }) => group.current as Group),
  );
  const { background, overrideMaterial } = scene;
  scene.background = null;
  scene.overrideMaterial = solid;
  gl.setRenderTarget(target);
  gl.render(scene, camera);
  scene.background = background;
  scene.overrideMaterial = overrideMaterial;
  hidden.forEach((object) => {
    object.visible = true;
  });
  // Back to the view as it was given, viewport and all
  gl.setRenderTarget(null);

  const autoClear = gl.autoClear;
  gl.autoClear = false;
  works.forEach(({ lines }) => gl.render(lines, camera));
  const { uniforms } = material;
  uniforms.pixel.value.set(1 / viewport.z, 1 / viewport.w);
  // The points reach half again past the weight, as the line thins out
  // toward the furthest of them
  uniforms.radius.value = PROFILE.weight * 1.5 * gl.getPixelRatio();
  if (camera instanceof PerspectiveCamera) {
    uniforms.near.value = camera.near;
    uniforms.far.value = camera.far;
  }
  gl.render(overlay, flat);
  gl.autoClear = autoClear;
};

// Draws the linework over a view the renderer has just drawn. What it
// needs from one frame to the next is made as it mounts and let go as it
// unmounts, so a remount starts afresh
export const useDrawLinework = () => {
  const pass = useRef<LineworkPass | null>(null);
  useEffect(() => {
    const made = createPass();
    pass.current = made;
    return () => {
      made.dispose();
      pass.current = null;
    };
  }, []);
  return useCallback((gl: WebGLRenderer, scene: Scene, camera: Camera) => {
    if (pass.current) drawLinework(gl, scene, camera, pass.current);
  }, []);
};

// For a canvas with one view: draws it, then its linework. Given a
// priority, so the canvas leaves the drawing to it
export const LineworkRender = () => {
  const draw = useDrawLinework();
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
    return invalidate;
  }, [invalidate]);
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);
    draw(gl, scene, camera);
  }, 1);
  return null;
};
