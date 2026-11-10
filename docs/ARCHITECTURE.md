# How ModHomes is built

ModHomes is a Next.js site that renders configurable modular homes in 3D with React Three Fiber. Every home is generated in code, almost all of it from simple box geometry. There are no imported 3D model files.

## Tech stack

| Area | Technology | Used for |
| --- | --- | --- |
| Framework | Next.js 13 (Pages Router), React 18, TypeScript | Routing, rendering, build |
| 3D | three.js, React Three Fiber, drei | Scene graph, cameras, controls, lighting, textures |
| UI | Material UI with Emotion, Tabler and MUI icons | Navbar, cards, control dock, swatches |
| Motion | Framer Motion | Page and card entrances, the info chip, the model card's count-up |
| Testing | Jest, React Testing Library (jsdom) | Unit tests in `__tests__/` |
| Hosting | Vercel | Deploys at [modhomes.vercel.app](https://modhomes.vercel.app/) |

## Project layout

```
pages/
  index.tsx           Landing page: hero + model cards
  homes/[home].tsx    Model viewer, e.g. /homes/mod3x2
components/           3D parts and UI controls
  insidescene.tsx     The viewer's inside canvas: walking, landscape, spec dots
  outsidescene.tsx    The viewer's outside canvas: orbit, sky, stage, site tiles
  docktoggle.tsx      The dock's round, captioned switches (Deck, Site, Specs)
  linework.tsx        The lines drawn over every view of the home
lib/
  models.ts           The model catalogue (slug, name, size, area, footprint)
  dimensions.ts       Shared dimensions: module size, story height, floor, base
  viewerstate.ts      The viewer's choices (view, finishes, decks, specs) and
                      the reducer that keeps them consistent
  media.ts            Media queries: phone layout, touch, reduced motion
  appliances.ts       The kitchen appliances shown in the inside view's spec dots
  viewposition.ts     Remembers whether the viewer was last inside or outside
  site.ts             The lot the Site view stands a home on, and its tile math
public/images/        Floor textures (CC0) and HDR environment maps
__tests__/            Jest tests, one file per component
```

## Pages

**Landing page (`/`).** `LandingHero` shows a home assembling itself on its steel frame. Walls slide in, then the floor, ceiling and roof drop into place, and finally the sliding doors slide in. `assembly.tsx` sets the timing, and `AssembleIn` animates each piece. Below the hero, `LandingModels` lists every model as a card. `ModelPreviews` draws all of the spinning card previews with one shared, transparent `<Canvas>` laid over the cards, instead of one WebGL context per card. Each preview is scissored into its card by `PreviewView`, positioned against the canvas rather than the screen. The canvas scrolls with the page instead of being fixed, so the models stay put on phones, where scrolling runs ahead of rendering.

**Model viewer (`/homes/[slug]`).** This page has two views, and each one has its own `<Canvas>`:

- **Outside:** `OrbitControls` around the home, set in `HomeStage` with a sky and a city HDR for lighting. `HomeStage` (`homestage.tsx`) is drei's `Stage` with the same lights and soft ground shadow, except it keeps the shadow. `Stage` clears and rebuilds the shadow on every render, so it blinked and faded back in whenever anything changed. `HomeStage` builds it once. While a deck moves, and for a moment after it settles, it blends new passes into the shadow, so the deck's shadow fades in or out and the rest stays put. The dock offers colors for the metal siding and, on two-wide homes or ones with a deck, the wood. A Deck button in the dock adds a covered deck to whichever glass side faces the camera, or removes the one there. A crane-style drop lowers each deck into place, and the same motion in reverse lifts it away (`deck.tsx`). The facing side is tracked in a small store outside React state, so orbiting re-renders only the button and not the whole scene. Decks stay when you switch views, and you can see them through the glass from inside.
- **Site (outside, optional):** a Site switch in the dock stands the home on Google's photorealistic 3D tiles of its lot. The tiles are drawn in the outside canvas itself, by `SiteTiles` (`sitetiles.tsx`) with NASA-AMMOS's `3d-tiles-renderer` (0.3.46, the last release that works with this three.js), so they share the home's depth: a neighbour's tree nearer the camera than the home covers it. The renderer's `ReorientationPlugin` recentres the tiles on the lot's coordinates, they're turned so north is -Z (and by the lot's heading) and scaled from metres to feet, and a ray cast straight down through the lot's middle finds the tiles' ground and raises or lowers them to stand it on the home's (`getTilesLift` in `lib/site.ts`), again whenever finer tiles arrive or the home's height changes. The tiles start at the lot's `height` above the WGS84 ellipsoid (USGS's elevation less NOAA's geoid there), so they're close before the ray settles them, and they stay hidden until it has. The tiles are photographs, so they're left out of the tone mapping and the home's lights don't touch them, and they're hidden while the stage draws its ground shadow (they're marked `offStage`), so only the home casts it. The sky is drawn first, behind everything, and the camera's far plane goes out to the horizon while the site shows (`SITE_CLIP`). The orbit can go out to 800 ft (`SITE_ORBIT_MAX_DISTANCE`) while the site shows, against 100 ft over the plain sky. The lot is at the foot of the mountains, so out there, as low as the orbit goes, the camera could sink into the hillside: each time it moves, a ray down finds the tiles' ground under it, and it's kept above that by 6 ft up close and by 15% of its distance from the home further out (`getCameraHeight`), so it looks down at the home over rising ground rather than through it. The lot is one set of coordinates in `SITE`, with its name, its height and the bearing the home faces: a vacant homesite at 790 Las Palmas Estates Drive, at the foot of the mountains in Palm Springs, about 36 m wide and 42 m deep, with houses either side. The home has to stand on ground that's bare in Google's tiles, not just in today's aerial photos: the tiles' capture can be older, and the first lot tried, on Tamarisk Road, still had a house in them. While the site shows, the middle of the header (`SiteAddress`, placed through the nav bar's `center`) names the lot and gives its coordinates, read-only for now, though not below 900px, where the bar's name and menu leave no room for it, and Google's logo and the imagery's credits sit at the bottom left (`SiteCredits`), as Google's terms ask. Loading the tile set's root is the billable request, so one renderer is made per page and kept, with the tiles it has loaded, across views, models and the switch going off and on; its session lasts three hours before the root is loaded again. Meanwhile the switch spins and a notice over the view says the site is loading, and if the tiles fail the notice says so for a few seconds. If the key is refused, the API isn't enabled, the day's quota is spent, or the home isn't settled within 30 seconds, the switch goes off and stays disabled, and the view is the plain sky. The renderer reaches for the browser's document as it loads, so the page loads `sitetiles.tsx` in the browser only. The switch only exists when `NEXT_PUBLIC_GOOGLE_MAPS_KEY` is set. The inside view is left alone: the tiles look smeared from the ground, and the projected landscape photo looks better than they would.
- **Inside:** first-person walking with `WalkControls`, using the keyboard and arrow pad on desktop or a joystick on touch screens. Movement is limited to the home's footprint and goes around the columns and the stair. A landscape HDR is projected onto the ground so the view outside looks real. The dock offers the floor material and, on homes with a kitchen and bathrooms, the color of their wall tile. In homes with a kitchen, a dot on the range, hood, dishwasher and fridge opens a card with the appliance's standard Bosch model, its key specs and a link to its product page (`hotspots.tsx`). The dots are drei `Html` overlays placed from the same layout math as the kitchen (`getApplianceSpots`). Each one shows only from in front of its appliance, so none shows through a wall, and fades out with distance. They pulse to draw the eye, and a Specs switch in the dock hides them.

## How a home is generated

A slug like `mod3x2` means 3 modules wide and 2 stories tall. `parseModel` reads it, and `HomeModel` builds the home from these parts:

- **`Module`:** one 8 × 40 ft steel-framed bay with posts, floor and ceiling slabs, and end-wall linings. Slabs can have a rectangular hole cut out of them (`getSlabPieces`), which is how the stair opening is made.
- **`EndWall`, `Wall`, `Roof`, `Foundation`:** the envelope and base. The foundation is a ring of 8" concrete stem walls (`getStemWalls`), set 0.5 ft in from the module edges so the modules cantilever past it.
- **`Deck`:** an optional 8 ft deep covered deck module against either glass side, as long as the home. Its steel frame takes the metal color, and its boards, flush with the ground floor, and slatted soffit take the wood color. Its fascia's underside lines up with the underside of the home's top beam over the glass. Its fascia's top is level with the parapet on one-story homes. On two-story homes the deck stays one story tall, its fascia's top level with the top of the band under the upper story's glass. Inside the fascia, its roof is a low hip like the home's, rising the same 0.825 ft from a slab to a ridge that's level with the fascia's top and hidden behind it. Its posts, at the corners and the middle of both long sides, stand on its floor frame, which sits on 8" concrete stem walls like the home's. The frame overhangs them by the same 0.5 ft as the home. The deck has no wall along the home's side: its end walls run in under the glass side's frame to meet the home's wall. As a deck is lowered, its stem walls rise out of the ground to meet it. All the boxes in one material are merged into one hand-built mesh (`getBoxesGeometry`), as the roof's are.
- **`SlidingDoors`:** full-height glass doors on both long sides, with a header and floor-line trim. Panes that a room is built against are filled with 6" horizontal cedar siding instead of glass.
- **`Stair`:** added to two-story homes in the first module. It has open treads, a cable railing, and a lined opening with a guard wall upstairs.
- **`Services`:** homes three or more modules wide give their middle module (right of centre in four-wide homes) to two bathrooms and a kitchen on the ground floor. Full-height walls enclose a tub bath at the back end and a shower bath beside it, each with a doorway from a different neighbouring module. Their side walls run on past the module's middle posts, hiding them, to frame a pantry and fridge wall. The rest of the module is an open kitchen with an island with a sink and stools, and a range run with wall cabinets against the front end wall, framed by short walls in line with the bathrooms' side walls. Two-wide homes get a smaller version in the back half of their right module, between the middle column and a joint in the glass doors: a closet and a small bath with a walk-in shower stand against the glass, whose two panes take siding, and a one-wall galley kitchen runs along their inside wall, its counter front on the line where the two modules meet. `bathroom.tsx` and `kitchen.tsx` lay out the fixtures against their walls, `stool.tsx` builds the island's counter stools (a molded walnut shell, generated as a curved mesh, on a splayed steel base), and `fixtures.tsx` holds the shared finishes, which are plain colours for now. The kitchens' and bathrooms' floors are laid in 12" tile with grout lines, matching the wall tile, and the galley's runs on across the next module to the glass. Every part that stands on the floor becomes a footprint that the inside walk goes around, so the bathrooms can be walked into through their doorways.

One scene unit is one foot. Each part's layout math (pane positions, stair treads, walk bounds, camera distances) is kept in exported pure functions, separate from the JSX. This keeps the geometry readable and lets it be unit tested without a WebGL context.

## Linework

Every view of a home, from the landing page's hero and model cards to the viewer's outside and inside, is drawn with lines over its finishes, in two weights, the way an architect draws (`linework.tsx`):

- **Light lines** run along every edge where faces meet at more than 20°, so boxes are outlined at their corners while curved parts stay smooth. Each line runs a little past its corners, 6% of its length up to 0.3 ft, so short trim only just overshoots while long walls run the full few inches. They're 1px, as thin as WebGL draws a line, and faint. Where two parts share an edge only one line is drawn, so joints don't come out twice as dark.
- **Heavy lines** mark the edges with space behind them: the home's outline against the sky, a floor that overhangs, a deck post in front of the glass. Whether there's space behind an edge depends on where the camera is, so these are found on screen rather than in the geometry. The home is drawn a second time on its own, as depth only, and a shader draws a 2px line wherever the depth steps back by more than 1.5% of the distance. It samples 18 points around each pixel and uses how many find a step as the line's opacity, so the lines have soft edges and rounded ends. Glass counts as solid in that pass, so what's inside gets only light lines.

`Linework` wraps the parts to draw. It's inside `HomeModel`, so the viewer and the model cards get it, and the hero wraps its assembling pieces in it. It traces each mesh's edges once and again only when the mesh's shape changes. Some parts, like the roof and decks, keep their geometry and swap its points as the home changes size, so a change to the points counts too. The light lines are kept in a scene of their own, outside the home's, so nothing that measures the home or draws its ground shadow counts them, and each one takes its mesh's place and visibility as it's drawn. Every finish is pushed back slightly in depth (`polygonOffset`), so its lines are drawn over it instead of flickering against it.

The lines are drawn after the view itself. A canvas with one view gets `<LineworkRender />`, which takes over its drawing: it draws the scene, then the lines. The model cards draw several views into one canvas, so each card calls `useDrawLinework`'s function after drawing its own.

## Shared styling

- `colors.tsx`: the color palette and exterior swatches
- `materials.tsx`: floor texture sets and the environment map path
- `panel.ts`: the frosted-glass style for controls that sit over the 3D view, and the site's ink and paper colors (`INK`, `PAPER`, and `ink(alpha)` and `paper(alpha)` for see-through versions)
- `swatchpicker.tsx`: the dock's swatches, each showing the current choice and opening a column of its options above it

## The Site view's key and cost

The tiles bill under Google Maps Platform's Map Tiles API: Photorealistic 3D Tiles SKU, 1,000 free a month, then $6.00 per 1,000. The billable request is the tile set's root, which a page loads once (and again after three hours); the tiles it then streams don't count against the daily quota, though Google's pricing page isn't plain about whether they're billed, so watch the first month's bill. A billing account has to be on the project even to use the free tier. To keep it free:

- Enable the Map Tiles API on the project, and make a key for it only, restricted to the site's HTTP referrers (`modhomes.vercel.app` and `localhost:3000`). It's `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, in `.env.local` locally and in Vercel's environment variables in production.
- In the Cloud console's quotas for the Map Tiles API, lower the daily root tile set requests to 32 (`DAILY_ROOT_REQUEST_CAP`): the free 1,000 spread over the longest month. Past it, the tiles fail for the rest of the day, the switch goes off, and the view falls back to the sky. Google's budgets only alert; they don't cap.
- Google's terms ask that its logo and the imagery's credits stay in view over the tiles, that they aren't cached or saved beyond what their headers allow, and that nothing is traced from them.

## Performance notes

- The landing page preloads the hero's floor textures and its HDR in `<Head>`, so they download in parallel with the JavaScript.
- Textures are 1K. Environment maps are served from `public/` instead of drei's CDN.
- The model cards share one WebGL canvas.
- Linework draws each view twice, once more as depth only for the heavy lines, so it costs most on the landing hero, which turns every frame. The heavy-line shader skips every pixel with no home in it, which is most of the screen in the outside view, the hero and the cards.
- The model page's two canvases render on demand (`frameloop="demand"`), so a view that isn't changing draws nothing. Orbiting and looking around ask for frames as they move, and anything that animates asks for them while it runs: the stage's ground shadow while it builds or follows a deck, a deck while the crane moves it, the site's tiles while any are downloading or parsing, and walking while a key, arrow or the joystick is held. Anything new that changes the scene from a frame loop or from outside React has to call `invalidate()` the same way, or it won't show until something else draws a frame.
- The kitchens' and bathrooms' hundreds of parts are drawn as one mesh per finish (`batchParts` and `getPartsGeometry` in `fixtures.tsx`), about a dozen draw calls instead of over 200. See-through parts are kept a mesh each, so three can sort them.
- The inside view shows once the floor it's drawn with has loaded; the other floor finishes load in the background (`FloorTextures`).
- Inter is self-hosted with `next/font`, rather than loaded from Google's stylesheet. `next/font` needs Next's SWC compiler, so Babel is only configured for Jest, in `package.json`.
- `/images/*` is cached for a day, then refreshed in the background (`next.config.js`). Images keep their names when they change, so a replaced image can take a day to reach returning visitors.

## Development

```bash
yarn install
yarn dev     # http://localhost:3000
yarn test    # Jest
yarn build   # production build
```
