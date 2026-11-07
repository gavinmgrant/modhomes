import React, { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Material, Raycaster, Vector3 } from "three";
import { TilesRenderer } from "3d-tiles-renderer";
import {
  GoogleCloudAuthPlugin,
  ReorientationPlugin,
} from "3d-tiles-renderer/plugins";
import { setSiteStatus } from "./sitemap";
import {
  FT_TO_M,
  getCameraHeight,
  getTilesLift,
  getTilesTurn,
  isTilesLiftPlausible,
  SITE,
  SITE_CLIP,
  SiteLocation,
  toRadians,
} from "../lib/site";

// Google's photorealistic 3D tiles, drawn in the outside canvas around the
// home. They share the home's depth, so trees and houses nearer the camera
// than the home cover it, as they would on the real lot

// How long to wait for the tiles to load and the home to be settled onto
// them before giving up on the site
const READY_TIMEOUT = 30000;
// A ray from this far above the lot, in feet, finds its ground
const RAY_HEIGHT = 100000;
// The renderer's loading state for its root, and its value for a root that
// wouldn't load, its FAILED, both of which its types leave out
type RootLoadingState = { rootLoadingState: number };
// How many tiles it's downloading and parsing, which its types leave out too
type LoadingStats = { stats: { downloading: number; parsing: number } };
const FAILED = -1;
// Changes to the ground's height smaller than this, in feet, are left alone,
// so the home doesn't twitch as finer tiles come in
const SETTLE = 0.05;

// One tile set per page. Loading its root is the billable request, so it's
// made once and kept, with every tile it has loaded, across views, models,
// and the switch being turned off and on again. Its root session lasts three
// hours, after which it's loaded again
let tiles: TilesRenderer | null = null;
// Feet the tiles are raised by to stand their ground on the scene's
let lift = 0;
let groundFound = false;
// Whether the tiles have loaded more since the ground was last found
let groundStale = true;

let started = false;

// Says the site is loading, and gives up on it if the home hasn't stood on
// the tiles in time. Once a page, from an effect, as it tells the page
const startLoading = () => {
  if (started) return;
  started = true;
  setSiteStatus("loading");
  window.setTimeout(() => {
    if (!groundFound) setSiteStatus("failed");
  }, READY_TIMEOUT);
};

const getTiles = (apiKey: string, site: SiteLocation) => {
  if (!tiles) {
    const created = new TilesRenderer();
    tiles = created;
    const auth = new GoogleCloudAuthPlugin({ apiToken: apiKey });
    created.registerPlugin(auth);
    // Once the root has loaded, an expired session is renewed by loading it
    // again. Not before: the plugin would retry a refused key, and trip
    // over the error it gets back
    const renew = () => {
      auth.autoRefreshToken = true;
      created.removeEventListener("load-tile-set", renew);
    };
    created.addEventListener("load-tile-set", renew);
    // Recentres the tiles on the lot, with its ground at about the origin
    created.registerPlugin(
      new ReorientationPlugin({
        lat: toRadians(site.lat),
        lon: toRadians(site.lng),
        height: site.height,
        recenter: true,
      })
    );
    created.addEventListener("load-model", ({ scene }) => {
      // The tiles are photographs, already lit and graded, so the home's
      // tone mapping is kept off them
      scene.traverse((object) => {
        if ("material" in object && object.material instanceof Material) {
          object.material.toneMapped = false;
        }
      });
    });
    created.addEventListener("tiles-load-end", () => {
      groundStale = true;
    });
  }
  return tiles;
};

const ray = new Raycaster();
const down = new Vector3(0, -1, 0);

interface SiteTilesProps {
  apiKey: string;
  // Height of the ground under the home, in the scene, kept up to date by
  // the stage as it measures the home
  groundY: React.MutableRefObject<number>;
  site?: SiteLocation;
}

// Inside the outside view's canvas, while the site is wanted. The tiles
// stay hidden until the home has been stood on their ground
export const SiteTiles = ({ apiKey, groundY, site = SITE }: SiteTilesProps) => {
  const { camera, gl, invalidate } = useThree();
  const tileSet = getTiles(apiKey, site);
  const raised = useRef<Group>(null);
  const lastGroundY = useRef<number | null>(null);

  useEffect(startLoading, []);

  // The tiles load what this camera sees, at the detail its view needs
  useEffect(() => {
    tileSet.setCamera(camera);
    return () => {
      tileSet.deleteCamera(camera);
    };
  }, [tileSet, camera]);

  // Out to the horizon while the site shows
  useEffect(() => {
    const { near, far } = camera;
    Object.assign(camera, SITE_CLIP);
    camera.updateProjectionMatrix();
    return () => {
      Object.assign(camera, { near, far });
      camera.updateProjectionMatrix();
    };
  }, [camera]);

  useFrame(() => {
    const { rootLoadingState } = tileSet as TilesRenderer & RootLoadingState;
    if (rootLoadingState === FAILED) {
      setSiteStatus("failed");
      return;
    }
    tileSet.setResolutionFromRenderer(camera, gl);
    camera.updateMatrixWorld();
    tileSet.update();
    // The canvas only draws when asked, so the tiles ask for frames while
    // any are on their way, to show them as they come and settle the home
    // on them
    const { downloading, parsing } = (tileSet as TilesRenderer & LoadingStats)
      .stats;
    if (!groundFound || groundStale || downloading > 0 || parsing > 0) {
      invalidate();
    }

    const group = raised.current;
    if (!group) return;
    group.position.y = lift;
    // Hidden until the home stands on them. A ray still finds them
    group.visible = groundFound;
    // Every frame until the ground is found, then whenever finer tiles
    // arrive or the home's height changes
    const due =
      !groundFound ||
      groundStale ||
      lastGroundY.current !== groundY.current;
    if (!due) return;
    // A ray straight down through the lot's middle finds the tiles' ground
    // there, and the tiles are raised or lowered to stand it on the scene's
    group.updateMatrixWorld(true);
    ray.set(new Vector3(0, RAY_HEIGHT, 0), down);
    const [hit] = ray.intersectObject(tileSet.group, true);
    groundStale = false;
    lastGroundY.current = groundY.current;
    if (!hit) return;
    const next = getTilesLift(hit.point.y, lift, groundY.current);
    // The first tiles in are coarse ones, whole regions at a time, whose
    // flat faces cut far under the real ground. Ground that far off isn't
    // the lot's, so it's passed over until the detailed tiles come in
    if (!isTilesLiftPlausible(next)) return;
    if (!groundFound || Math.abs(next - lift) > SETTLE) {
      lift = next;
      group.position.y = lift;
    }
    if (!groundFound) {
      groundFound = true;
      setSiteStatus("ready");
    }
  });

  // Keeps the camera above the tiles' ground wherever it orbits to. The
  // orbit works out where the camera is from where it was, so a camera
  // raised here stays raised, looking down a little more steeply
  const lastCamera = useRef(new Vector3(NaN, NaN, NaN));
  useFrame(() => {
    const position = camera.position;
    if (!groundFound || position.equals(lastCamera.current)) return;
    ray.set(new Vector3(position.x, RAY_HEIGHT, position.z), down);
    const [hit] = ray.intersectObject(tileSet.group, true);
    // The home stands at the origin
    const distance = Math.hypot(position.x, position.z);
    if (hit) position.y = getCameraHeight(position.y, hit.point.y, distance);
    lastCamera.current.copy(position);
  });

  return (
    <group
      ref={raised}
      position-y={lift}
      // Left out of the stage's ground shadow, which only the home casts
      userData={{ offStage: true }}
    >
      <group rotation-y={getTilesTurn(site.heading)} scale={1 / FT_TO_M}>
        {/* Kept, not disposed, when the canvas goes, for the next one */}
        <primitive object={tileSet.group} dispose={null} />
      </group>
    </group>
  );
};

// The Google logo, white, for over imagery, as the Maps JavaScript API
// draws it on its own maps
const GOOGLE_LOGO =
  "https://maps.gstatic.com/mapfiles/api-3/images/google_white5_hdpi.png";
// How often to gather the credits of the tiles in view
const CREDITS_MS = 1000;

// Pixels between the credits and the bottom of the view, or the dock
const CREDITS_GAP = 8;

interface SiteCreditsProps {
  // Whether the tiles are in view
  shown: boolean;
  // The dock along the bottom of the view, which the credits keep clear of
  dock?: React.RefObject<HTMLElement>;
}

// Google's logo and the credits for the imagery in view, along the bottom
// left of the view, as Google's terms ask of anything drawing its tiles. On
// a screen narrow enough that the dock reaches under them, they sit above it
export const SiteCredits = ({ shown, dock }: SiteCreditsProps) => {
  const [credits, setCredits] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const [bottom, setBottom] = useState(CREDITS_GAP);

  // Measured again whenever the dock or the credits change size, or the
  // view does. Moving up or down doesn't change whether they're in the
  // dock's way, so this settles at once
  useEffect(() => {
    const own = box.current;
    const bar = dock?.current;
    const view = own?.offsetParent;
    if (!shown || !own || !bar || !view) return;
    const place = () => {
      const credits = own.getBoundingClientRect();
      const docked = bar.getBoundingClientRect();
      const clear = credits.right + CREDITS_GAP <= docked.left;
      setBottom(
        clear
          ? CREDITS_GAP
          : view.getBoundingClientRect().bottom - docked.top + CREDITS_GAP
      );
    };
    place();
    const watch = new ResizeObserver(place);
    watch.observe(own);
    watch.observe(bar);
    window.addEventListener("resize", place);
    return () => {
      watch.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [shown, dock]);
  useEffect(() => {
    if (!shown || !tiles) return;
    const tileSet = tiles;
    const gather = () => {
      const text = tileSet
        .getAttributions()
        .filter((credit) => credit.type === "string")
        .map((credit) => credit.value)
        .join("; ");
      setCredits(text);
    };
    gather();
    const timer = window.setInterval(gather, CREDITS_MS);
    return () => window.clearInterval(timer);
  }, [shown]);

  if (!shown) return null;
  return (
    <div
      ref={box}
      style={{
        position: "absolute",
        left: 12,
        bottom,
        // Over the canvas, which is positioned and comes after it
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        gap: 8,
        maxWidth: "40%",
        pointerEvents: "none",
        color: "#fff",
        fontSize: 10,
        lineHeight: 1.2,
        textShadow: "0 0 2px rgba(0, 0, 0, 0.8)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={GOOGLE_LOGO} alt="Google" height={18} />
      {credits && <span>{credits}</span>}
    </div>
  );
};
