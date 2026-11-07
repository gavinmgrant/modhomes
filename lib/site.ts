// The Site view stands the home on a real lot: Google's photorealistic 3D
// tiles of the lot and its surroundings are drawn in the outside view's own
// scene, around the home, so what's nearer the camera than the home, like a
// neighbour's tree, covers it. Units in the scene are feet, and the tiles'
// are metres

export const FT_TO_M = 0.3048;

export type SiteLocation = {
  // How the lot reads on the site chip: its street address, or a place
  // where there isn't one
  label: string;
  // Where the home stands, which has to be bare ground: the home is settled
  // onto whatever the tiles have there
  lat: number;
  lng: number;
  // Metres above the WGS84 ellipsoid, which the tiles are measured from, of
  // the ground there, near enough. It's only where the tiles start out: the
  // home is then settled onto the tiles' own ground
  height: number;
  // Compass bearing, in degrees clockwise from north, of the way the scene's
  // -Z points: where a camera starting out at +Z looks. Turning it turns the
  // home on its lot
  heading: number;
};

// v1 orbits one lot: a vacant homesite on the north side of Las Palmas
// Estates Drive, at the foot of the mountains in Palm Springs, about 36 m
// wide and 42 m deep, with houses either side. The coordinates are the
// middle of its bare ground, in the county's parcel and in the tiles. Its
// height is USGS's 161.7 m above sea level, less the 32.2 m the sea level
// (NOAA's geoid) is under the ellipsoid there. At a heading of 0 the home's
// glass sides face east and west, and its end faces the street
export const SITE: SiteLocation = {
  label: "790 Las Palmas Estates Drive, Palm Springs",
  lat: 33.831986,
  lng: -116.556334,
  height: 129.5,
  heading: 0,
};

// The key is public by nature: it's sent from the browser. Lock it to the
// site's domains and to the Map Tiles API in the Cloud console, and cap the
// API's daily root requests there, so a busy month can't run up a bill
export const getSiteKey = () => process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

// Photorealistic 3D Tiles give 1,000 free billable requests a month, and
// each page that shows the site makes one, for the tile set's root. Spread
// over the longest month, that's the most to allow in a day
export const FREE_ROOT_REQUESTS = 1000;
export const DAILY_ROOT_REQUEST_CAP = Math.floor(FREE_ROOT_REQUESTS / 31);

// How far out the orbit can go, in feet, with the site to see around the
// home. On its own the home is kept within 100 ft
export const SITE_ORBIT_MAX_DISTANCE = 800;

// How far above the tiles' ground under it the orbiting camera is kept, in
// feet: a few feet up close, and further out a share of how far it is from
// the home. The ground round a lot isn't flat, so out at the orbit's edge,
// as low as it goes, the camera could otherwise sink into a hillside, or
// skim it with the slope between it and the home
export const SITE_CAMERA_CLEARANCE = { least: 6, perFoot: 0.15 };

// The height, in feet, to put the camera at, given the tiles' ground under
// it and how far it is across the ground from the home: where it is, unless
// that's too near the ground or under it
export const getCameraHeight = (
  cameraY: number,
  groundHit: number,
  distance: number
) =>
  Math.max(
    cameraY,
    groundHit +
      Math.max(
        SITE_CAMERA_CLEARANCE.least,
        distance * SITE_CAMERA_CLEARANCE.perFoot
      )
  );

// The outside camera's clipping planes, in feet, while the site shows: out
// to the mountains on the horizon, and no nearer than needed, since the
// further the near plane is, the less the ground flickers in the distance
export const SITE_CLIP = { near: 1, far: 300000 };

// e.g. 37.8039° N, 122.4654° W: four places is about 10 m, as close as a
// lot's position needs reading
export const formatCoordinates = (lat: number, lng: number, places = 4) => {
  const part = (value: number, positive: string, negative: string) =>
    `${Math.abs(value).toFixed(places)}° ${value < 0 ? negative : positive}`;
  return `${part(lat, "N", "S")}, ${part(lng, "E", "W")}`;
};

export const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

// The tiles come recentred on the lot with north towards +Z and west towards
// +X. The scene has north towards -Z and east towards +X, before the site's
// heading turns it, so the tiles are turned half a turn, and then by the
// heading, about the vertical
export const getTilesTurn = (heading: number) =>
  Math.PI + toRadians(heading);

// How far to raise the tiles, in feet, to stand their ground at the lot's
// middle on the scene's ground: `groundHit` is where a ray straight down
// meets the tiles there, with them raised by `lift` already
export const getTilesLift = (groundHit: number, lift: number, groundY: number) =>
  groundY - (groundHit - lift);

// The lot's height is known to within a few metres, so the tiles shouldn't
// need raising or lowering, in feet, by more than this. Ground found further
// off belongs to a coarse tile standing in for the detailed ones
export const MAX_TILES_LIFT = 300;
export const isTilesLiftPlausible = (lift: number) =>
  Math.abs(lift) <= MAX_TILES_LIFT;
