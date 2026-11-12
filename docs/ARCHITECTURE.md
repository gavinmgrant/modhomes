# How ModHomes is built

ModHomes is a Next.js site that renders configurable modular homes in 3D with React Three Fiber. Every home is generated in code, almost all of it from simple box geometry. There are no imported 3D model files.

It's a concept, not a builder's product. The factory, rates, delivery and schedule are placeholders. There's no backend or database, and reserving takes no payment and saves nothing.

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
  builders.tsx        For builders: a short pitch, e.g. /builders
  homes/[home]/
    index.tsx         Model viewer, e.g. /homes/mod3x2?floor=concrete
    checkout.tsx      Checkout, e.g. /homes/mod3x2/checkout?floor=concrete
components/           3D parts and UI controls
  insidescene.tsx     The viewer's inside canvas: walking, landscape, spec dots
  outsidescene.tsx    The viewer's outside canvas: orbit, sky, stage, site tiles
  modelcard.tsx       The viewer's card: specs, price as configured, Reserve
  docktoggle.tsx      The dock's round, captioned switches (Deck, Site, Specs)
  viewnotice.tsx      The notice over a 3D view while something loads
  deck.tsx            The covered deck module, its stair, and its crane drop
  linework.tsx        The lines drawn over every view of the home
  rooms.tsx           The bedrooms, and the bath stacked upstairs
  checkout.tsx        The checkout's line items, totals and schedule
lib/
  models.ts           The model catalogue (slug, name, size, area, footprint)
  dimensions.ts       Shared dimensions: module size, story height, floor, base
  viewerstate.ts      The viewer's choices (view, finishes, decks, specs) and
                      the reducer that keeps them consistent
  media.ts            Media queries: phone layout, touch, reduced motion
  appliances.ts       The kitchen appliances shown in the inside view's spec dots
  pricing.ts          What a home costs as configured: its quantities, the
                      rate card and the quote's line items
  homeconfig.ts       A configured home's finishes and decks, in its URL
  delivery.ts         Delivery from the factory, the set, the order's total
                      and deposit, and the schedule
  viewposition.ts     Remembers whether the viewer was last inside or outside
  site.ts             The lot the Site view stands a home on, and its tile math
public/images/        Floor textures (CC0) and HDR environment maps
__tests__/            Jest tests, one file per component
```

## Pages

**Landing page (`/`).** `LandingHero` shows a home assembling itself on its steel frame. Walls slide in, then the floor, ceiling and roof drop into place, and finally the sliding doors slide in. `assembly.tsx` sets the timing, and `AssembleIn` animates each piece. Below the hero, `LandingModels` lists every model as a card. `ModelPreviews` draws all of the spinning card previews with one shared, transparent `<Canvas>` laid over the cards, instead of one WebGL context per card. Each preview is scissored into its card by `PreviewView`, positioned against the canvas rather than the screen. The canvas scrolls with the page instead of being fixed, so the models stay put on phones, where scrolling runs ahead of rendering.

**Model viewer (`/homes/[slug]`).** This page has two views, and each one has its own `<Canvas>`:

- **Outside:** `OrbitControls` around the home, set in `HomeStage` with a sky and a city HDR for lighting. The view opens level, with the camera and the orbit's target 6 ft above the ground floor on every model (`EYE_HEIGHT` in `homemodel.tsx`). The camera moves up or down with the target when the model changes, and the closest zoom is measured from the target to the home's farthest corner. `HomeStage` (`homestage.tsx`) is drei's `Stage` with the same lights and soft ground shadow, except it keeps the shadow. `Stage` clears and rebuilds the shadow on every render, so it blinked and faded back in whenever anything changed. `HomeStage` builds it once. While a deck moves, and for a moment after it settles, it blends new passes into the shadow, so the deck's shadow fades in or out and the rest stays put. The dock offers colors for the metal siding and, on two-wide homes or ones with a deck, the wood. A Deck button in the dock adds a covered deck to whichever glass side faces the camera, or removes the one there. A crane-style drop lowers each deck into place, and the same motion in reverse lifts it away (`deck.tsx`). The facing side is tracked in a small store outside React state, so orbiting re-renders only the button and not the whole scene. Decks stay when you switch views, and you can see them through the glass from inside.
- **Site (outside, optional):** a Site switch in the dock stands the home on Google's photorealistic 3D tiles of its lot. The tiles are drawn in the outside canvas itself, by `SiteTiles` (`sitetiles.tsx`) with NASA-AMMOS's `3d-tiles-renderer` (0.3.46, the last release that works with this three.js), so they share the home's depth: a neighbor's tree nearer the camera than the home covers it. The renderer's `ReorientationPlugin` recenters the tiles on the lot's coordinates, they're turned so north is -Z (and by the lot's heading) and scaled from meters to feet, and a ray cast straight down through the lot's middle finds the tiles' ground and raises or lowers them to stand it on the home's (`getTilesLift` in `lib/site.ts`), again whenever finer tiles arrive or the home's height changes. The tiles start at the lot's `height` above the WGS84 ellipsoid (USGS's elevation less NOAA's geoid there), so they're close before the ray settles them, and they stay hidden until it has. The tiles are photographs, so they're left out of the tone mapping and the home's lights don't touch them, and they're hidden while the stage draws its ground shadow (they're marked `offStage`), so only the home casts it. The sky is drawn first, behind everything, and the camera's far plane goes out to the horizon while the site shows (`SITE_CLIP`). The orbit can go out to 800 ft (`SITE_ORBIT_MAX_DISTANCE`) while the site shows, against 100 ft over the plain sky. The lot is at the foot of the mountains, so out there, as low as the orbit goes, the camera could sink into the hillside: each time it moves, a ray down finds the tiles' ground under it, and it's kept above that by 6 ft up close and by 15% of its distance from the home further out (`getCameraHeight`), so it looks down at the home over rising ground rather than through it. The lot is one set of coordinates in `SITE`, with its name, its height and the bearing the home faces: a vacant homesite at 790 Las Palmas Estates Drive, at the foot of the mountains in Palm Springs, about 36 m wide and 42 m deep, with houses either side. The home has to stand on ground that's bare in Google's tiles, not just in today's aerial photos: the tiles' capture can be older, and the first lot tried, on Tamarisk Road, still had a house in them. While the site shows, the middle of the header (`SiteAddress`, placed through the nav bar's `center`) names the lot and gives its coordinates, read-only for now, though not below 900px, where the bar's name and menu leave no room for it, and Google's logo and the imagery's credits sit at the bottom left (`SiteCredits`), as Google's terms ask. Loading the tile set's root is the billable request, so one renderer is made per page and kept, with the tiles it has loaded, across views, models and the switch going off and on; its session lasts three hours before the root is loaded again. Meanwhile the switch spins and a notice over the view says the site is loading, and if the tiles fail the notice says so for a few seconds. If the key is refused, the API isn't enabled, the day's quota is spent, or the home isn't settled within 30 seconds, the switch goes off and stays disabled, and the view is the plain sky. The renderer reaches for the browser's document as it loads, so the page loads `sitetiles.tsx` in the browser only. The switch only exists when `NEXT_PUBLIC_GOOGLE_MAPS_KEY` is set. The inside view is left alone: the tiles look smeared from the ground, and the projected landscape photo looks better than they would.
- **Inside:** first-person walking with `WalkControls`, using the keyboard and arrow pad on desktop or a joystick on touch screens. Movement is limited to the home's footprint and goes around the columns and the stair. Through the glass is a desert: Poly Haven's Rogland Overcast (CC0), sandy scrub under granite boulder hills. The photo is projected onto the ground with real parallax (`GroundProjectedSkybox`), taken at standing eye level, and the ground curves up into the sky 250 ft out, so the hills stand up rather than smear across the sand as you walk. It's drawn from Poly Haven's tone-mapped JPG at 8K where a large screen and the GPU and memory allow it, or at 4K, decoded off the main thread. A 1K HDR of the same place lights the room. The home shows before the photo has loaded, with the HDR as a soft stand-in at the windows and "Loading the landscape…" over the view (`ViewNotice`, which the Site view's notice shares). The dock offers the floor material and, on homes with a kitchen and bathrooms, the color of their wall tile. In homes with a kitchen, a dot on the range, hood, dishwasher and fridge opens a card with the appliance's standard Bosch model, its key specs and a link to its product page (`hotspots.tsx`). The dots are drei `Html` overlays placed from the same layout math as the kitchen (`getApplianceSpots`). Each one shows only from in front of its appliance, so none shows through a wall, and fades out with distance. They pulse to draw the eye, and a Specs switch in the dock hides them.

Over both views, the model card (`modelcard.tsx`) lists the home's floor area, its beds and baths, and its footprint, which grows with its decks. Below them are its price as configured and a Reserve button. On a phone the card starts closed, showing only the name, price and Reserve, and its header opens it. Its numbers count up from zero when it appears, and on to each new value as finishes and decks change. The count is a fixed 0.8 s ease-out rather than a spring, so the area and price land together however big they are.

**Checkout (`/homes/[slug]/checkout`).** A Reserve button on the model card opens the checkout for the home as configured. It's a concept: reserving takes no payment and keeps nothing. The page is rendered on the server for each request (`getServerSideProps`), so the home in the URL is in its HTML from the start, and it's kept out of search results. Rendering on the server can take a moment, so from the route change starting until it lands or fails, the viewer shows "Preparing your reservation…" over the 3D view, in place of the Site view's notice. It shows the home's finishes and decks with a link back to change them, and every line of the price by group with its quantity and rate. Then it adds a Delivery and set group, the total, and a 10% deposit due to reserve. Reserving opens a confirmation in a modal, with a made-up order number, when building would start and when it would be ready to move in. Once it's closed, the Reserve button reads Reserved with the order number and reopens it, so a home can't be reserved twice. Beside the price is the schedule from reserving to moving in. See [Checkout](#checkout).

**For builders (`/builders`).** A short version of [FOR-BUILDERS.md](./FOR-BUILDERS.md) for modular home builders: what the demo could do for their sales, what they'd provide, the phases, and what's good to know, with an email button at the top and the end. It links to the full version and to this doc on GitHub, so those links only work once the docs are on `main`. The footer, the nav menu (under the models) and the Reserve confirmation all link to it, which keeps the pitch at the edges of the demo rather than over the 3D views.

## How a home is generated

A slug like `mod3x2` means 3 modules wide and 2 stories tall. `parseModel` reads it, and `HomeModel` builds the home from these parts:

- **`Module`:** one 8 × 40 ft steel-framed bay with posts, floor and ceiling slabs, and end-wall linings. Slabs can have a rectangular hole cut out of them (`getSlabPieces`), which is how the stair opening is made.
- **`EndWall`, `Wall`, `Roof`, `Foundation`:** the envelope and base. The foundation is a ring of 8" concrete stem walls (`getStemWalls`), set 0.5 ft in from the module edges so the modules cantilever past it. On two-story homes, the upper end wall overlaps the lower one, and the joint between them lines up with the steel beam of a deck's roof beside it: the lower wall stops at the beam's top, which is the upper story's floor, and the upper wall reaches down to the beam's underside (`STACK_JOINT_DROP` in `wall.tsx`).
- **`Deck`:** an optional 8 ft deep covered deck module against either glass side, as long as the home. It doesn't line up with the home: it slides one glass pane along it (`DECK_SLIDE`), mullion to mullion, so its middle post stands in front of a mullion, and the decks on the two sides slide opposite ways. Where a deck runs on past the home's end, a stair runs down from its inner edge to the ground along the end wall, as wide as the overhang: four risers, with treads of two deck boards each on steel channel stringers. The model card's footprint counts each deck's slide in the home's length. Its steel frame takes the metal color, and its boards, flush with the ground floor, and slatted soffit take the wood color. Its fascia's underside lines up with the underside of the home's top beam over the glass. Its fascia's top is level with the parapet on one-story homes. On two-story homes the deck stays one story tall, its fascia's top level with the top of the band under the upper story's glass. Inside the fascia, its roof is a low hip like the home's, rising the same 0.825 ft from a slab to a ridge that's level with the fascia's top and hidden behind it. Its posts, at the corners and the middle of both long sides, stand on its floor frame, which sits on 8" concrete stem walls like the home's. The frame overhangs them by the same 0.5 ft as the home. Under the overhang past the home's end, they step back to clear the stair, and the home's end stem wall runs out to meet them. The deck has no wall along the home's side: its end walls run in under the glass side's frame to meet the home's wall. As a deck is lowered, its stem walls rise out of the ground to meet it. All the boxes in one material are merged into one hand-built mesh (`getBoxesGeometry`), as the roof's are.
- **`SlidingDoors`:** full-height glass doors on both long sides, with a header and floor-line trim. Panes that a room is built against are filled with 6" horizontal cedar siding instead of glass.
- **`Stair`:** added to two-story homes in the first module, running along the glass. It has open treads, a cable railing, and a lined opening set against the columns on the glass side, so the whole stair shows through the glass and there's no narrow strip of floor beside it upstairs. Upstairs, a wall runs along its inside and across its far end to the glass, centered on a joint between panes, open where the stair arrives. The walls run up to the ceiling, so the rooms beside the stair share them.
- **`Services`:** homes three or more modules wide give their middle module (right of center in four-wide homes) to two bathrooms and a kitchen on the ground floor. Full-height walls enclose a tub bath at the back end and a shower bath beside it, each with a doorway from a different neighboring module. Their side walls run on past the module's middle posts, hiding them, to frame a pantry and fridge wall. The rest of the module is an open kitchen with an island with a sink and stools, and a range run with wall cabinets against the front end wall, framed by short walls in line with the bathrooms' side walls. Two-wide homes get a smaller version in the back half of their right module, between the middle column and a joint in the glass doors: a closet and a small bath with a walk-in shower stand against the glass, whose two panes take siding, and a one-wall galley kitchen runs along their inside wall, its counter front on the line where the two modules meet. `bathroom.tsx` and `kitchen.tsx` lay out the fixtures against their walls, `stool.tsx` builds the island's counter stools (a molded walnut shell, generated as a curved mesh, on a splayed steel base), and `fixtures.tsx` holds the shared finishes, which are plain colors for now. The kitchens' and bathrooms' floors are laid in 12" tile with grout lines, matching the wall tile, and the galley's runs on across the next module to the glass. Every doorway has a pocket door, drawn open: its walnut leaf slid into the wall beside it, with only its leading edge showing (`pocketDoor` in `fixtures.tsx`). Every part that stands on the floor becomes a footprint that the inside walk goes around, so the bathrooms can be walked into through their doorways.
- **`Rooms`:** the bedrooms, the walk-in closets upstairs, and in two-story homes a bath stacked over one below (`rooms.tsx`). Each model's rooms are listed in `ROOM_PLANS`, and `lib/models.ts` gives the same counts of bedrooms and baths, which the model card shows: the 1x1 is one open room for an office or a gym, and the rest have from 1 bed and 1 bath (2x1) to 4 beds and 3 baths (4x2). A bedroom needs a window, and only the outermost modules have glass, along the long sides, so every bedroom has glass on one side, and runs from an end wall to the first joint in the glass doors, about 13 ft. A cross wall there, with a pocket door, carries on across the modules beside it until it meets the next wall: the services module's, the upstairs bath's, or the stair's. So a bedroom is one module wide where that's all there's room for, and two or three where a wall in the next module lets it run on and still leave a way through to the other rooms. Only where there's no wall to meet does a bedroom build a side wall of its own. The tub bath's door opens into the module to its +x side, so a bedroom there has it as its own bath. Upstairs, the front bedroom's cross wall runs on to the stair's inside wall, so the bedroom takes in the floor beside the stair, and that wall carries on to the end wall as the front of a walk-in closet beyond the stair, between it and the glass, with the bedroom's door to it. The bath stands over the tub bath, its door in a front wall level with the bedrooms' cross walls, opening onto the hall. A 2x2 has a shower bath over the galley's instead, against the same sided panes, opening onto the landing, and behind it a second walk-in closet, over the galley's, for the back bedroom. A 4x2 has glass for only three bedrooms upstairs, so its fourth is on the ground floor. There are no wardrobes, and both walk-in closets stand against the glass, so they're left empty, without a shelf or rail. The inside walk is on the ground floor only, so the upstairs rooms are seen through the glass from outside, but a test walks the upper floor too, from the top of the stair to every bedroom and closet.

One scene unit is one foot. Each part's layout math (pane positions, stair treads, walk bounds, camera distances) is kept in exported pure functions, separate from the JSX. This keeps the geometry readable and lets it be unit tested without a WebGL context.

## Pricing

Every home is priced as configured (`lib/pricing.ts`). `getQuantities` counts what a home is built from with the same functions that draw it: its modules and the ones stacked on others, its glass panes and the cedar panels that replace some (`getPaneLayout`, `getSidedPanes`), its end wall panels, its roof area, its foundation's stem wall (`getStemWalls`), its stair, its kitchen and baths and their appliances (`getApplianceSpots`), its bedroom and closet walls and pocket doors, and the bath stacked upstairs (`getRoomsLayout`), and its decks, counted from the moment one is added until it starts lifting (`isDeckUp`). `getQuote` multiplies them by the rate card and returns line items in groups (Structure, Envelope, Interior, Kitchen and baths, Decks, Finishes) and their total.

Because the quantities follow the geometry, homes with the same number of modules price differently: a Mod 2x2 has twice a Mod 4x1's glass, a stair, stacked modules and a bath stacked upstairs, which outweigh the 4x1's larger roof and foundation and its full kitchen with two baths, so the 2x2 costs more.

All the rates are in two constants, to tune in one place. `RATES` prices the parts. `FINISH_RATES` gives each swatch's upcharge by its name, in the unit its line is priced in: metal per module, trim per glass pane, wood per cedar panel and per deck, and tile once per home. The floor is priced outright per square foot of floor area, since every home has one: carpet the least, then bamboo, walnut a little more, and concrete the most, so switching floors moves the price either way. The module rate leaves the floor finish out. A test checks that every swatch in the dock has an entry. The dock's default finishes, walnut floor and all, are in the starting price, so a model's starting price (`getStartingPrice`), shown as "From" on the landing page's cards, is what it costs when it first opens. Each appliance in `lib/appliances.ts` carries an approximate list price. The rates are placeholders for a concept, not real prices.

The model card shows the price in full dollars, so even a small upcharge moves it, and counts up or down to each new price, over 0.8 s, as finishes and decks change.

## Configuration in the URL

A configured home lives in its URL's query (`lib/homeconfig.ts`), e.g. `/homes/mod3x2?metal=copper&floor=concrete&decks=left,right`, so it can be reloaded, shared, and taken to the checkout. Each finish is its swatch's name in lowercase with dashes, and decks are `left` (-x) and `right` (+x). Only what differs from the dock's defaults is written, so a plain model's URL has no query. Anything unknown in the query falls back to the default, and decks from it open already in place. What's being looked at (inside or outside, the site, the spec dots) isn't part of the home, so it stays out; whether the viewer was last inside is still remembered in local storage.

The model page is prerendered without a query, which the router has once it's ready. The page then loads what the URL asks for (the reducer's `load` action), and again whenever the URL changes some other way, like going back or switching models. Each finish or deck picked is written to the URL with a shallow `router.replace`, so it adds no history and fetches nothing. The two effects compare the serialized query, so neither sets the other off. Switching models from the menu brings the query along, so the finishes picked carry over.

## Checkout

`lib/delivery.ts` prices getting a home to its lot and setting it there. The factory is fictional, in an industrial park by San Bernardino's airport. The drive to the lot in Palm Springs (`SITE`) is the great-circle distance times a road factor of 1.25, about 53 miles. Each module is its own oversize load, with trucking per mile and a permit and escort per load. A crane sets four modules a day. Each module is then set, sealed and connected, and those stacked on another cost more to set. `getOrder` adds these lines to the home's quote, with a 10% deposit. `getSchedule` runs from the day it's opened: three weeks of engineering and permits, a build of 4 weeks plus 2 a module, a week's trucking, the crane days, and six weeks of finish work to move in. Dates are days in UTC, made on the server, so the page's HTML and the browser agree. Like the home's, the delivery rates are placeholders.

## Linework

Every view of a home, from the landing page's hero and model cards to the viewer's outside and inside, is drawn with lines over its finishes, in two weights, the way an architect draws (`linework.tsx`):

- **Light lines** run along every edge where faces meet at more than 20°, so boxes are outlined at their corners while curved parts stay smooth. Each line runs a little past its corners, 6% of its length up to 0.3 ft, so short trim only just overshoots while long walls run the full few inches. They're 1px, as thin as WebGL draws a line, and faint. Where two parts share an edge only one line is drawn, so joints don't come out twice as dark.
- **Heavy lines** mark the edges with space behind them: the home's outline against the sky, a floor that overhangs, a deck post in front of the glass. Whether there's space behind an edge depends on where the camera is, so these are found on screen rather than in the geometry. The home is drawn a second time on its own, as depth only, and a shader draws a 2px line wherever the depth steps back by more than 1.5% of the distance. It samples 18 points around each pixel and uses how many find a step as the line's opacity, so the lines have soft edges and rounded ends. Glass counts as solid in that pass, so what's inside gets only light lines. Each pixel of a heavy line takes the home's depth there, brought 0.5% of the distance nearer, and is tested against the view's own depth, so anything in front of the home, like the Site view's ground, trees and neighbors, hides it as it hides the light lines.

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
- Floor and wood textures and the lighting HDRs are 1K. The inside view's landscape photo is the exception, since at 2K the ground near the home smeared into streaks: it's 8K (5.7 MB, about 128 MB of graphics memory) only on a large screen whose GPU takes a texture that size and, where the browser says, with at least 4 GB of memory, and 4K (1.4 MB) otherwise. Environment maps are served from `public/` instead of drei's CDN.
- The model cards share one WebGL canvas.
- Linework draws each view twice, once more as depth only for the heavy lines, so it costs most on the landing hero, which turns every frame. The heavy-line shader skips every pixel with no home in it, which is most of the screen in the outside view, the hero and the cards.
- The model page's two canvases render on demand (`frameloop="demand"`), so a view that isn't changing draws nothing. Orbiting and looking around ask for frames as they move, and anything that animates asks for them while it runs: the stage's ground shadow while it builds or follows a deck, a deck while the crane moves it, the site's tiles while any are downloading or parsing, and walking while a key, arrow or the joystick is held. Anything new that changes the scene from a frame loop or from outside React has to call `invalidate()` the same way, or it won't show until something else draws a frame.
- The kitchens' and bathrooms' hundreds of parts are drawn as one mesh per finish (`batchParts` and `getPartsGeometry` in `fixtures.tsx`), about a dozen draw calls instead of over 200. See-through parts are kept a mesh each, so three can sort them.
- The inside view shows once the floor it's drawn with has loaded; the other floor finishes load in the background (`FloorTextures`).
- Inter is self-hosted with `next/font`, rather than loaded from Google's stylesheet. `next/font` needs Next's SWC compiler, so Babel is only configured for Jest, in `package.json`.
- `/images/*` is cached for a day, then refreshed in the background (`next.config.js`). Images keep their names when they change, so a replaced image can take a day to reach returning visitors.

## Adapting it to another builder's homes

Most of what makes ModHomes one particular builder is kept in a few constants, so another builder's homes, prices and brand mostly change these:

| What | Where |
| --- | --- |
| Name and share images | `SITE_NAME` in `pagemeta.tsx`, the nav bar, the footer, and the share cards in `public/og/` |
| Ink and paper colors | `INK` and `PAPER` in `panel.ts` |
| Models, with their beds and baths | `MODELS` in `lib/models.ts` |
| Bedrooms, closets and the bath upstairs | `ROOM_PLANS` in `rooms.tsx` |
| Exterior colors | `METAL_OPTIONS`, `TRIM_OPTIONS` and `WOOD_OPTIONS` in `colors.tsx` |
| Floors and tile | `FLOOR_OPTIONS` and `TILE_OPTIONS` in `materials.tsx`, with their textures in `public/images/materials/` |
| The finishes a home opens with | `DEFAULT_FINISHES` in `lib/viewerstate.ts` |
| Kitchen appliances | `APPLIANCES` in `lib/appliances.ts` |
| Prices | `RATES` and `FINISH_RATES` in `lib/pricing.ts` (a test checks every swatch has a rate) |
| Factory, delivery, deposit and schedule | `FACTORY`, `DELIVERY_RATES`, `DEPOSIT_RATE` and `getSchedule` in `lib/delivery.ts` |
| The lot | `SITE` in `lib/site.ts` |
| The view through the glass | `LANDSCAPE` and `LIGHTING` in `insidescene.tsx` |
| The concept notices and the pitch | `footer.tsx`, the checkout page, and the For builders page (`pages/builders.tsx`), which a builder's own site would drop |

The module's size is `MODULE` in `lib/dimensions.ts`, but the layouts were fitted to 8 × 40 ft modules: the glass panes, stair, kitchens, baths and rooms are placed to land on its joints, and a few parts still use 8 and 40 directly. Homes built from modules of another size, or that aren't rows of side-by-side modules, need their own generator parts. [FOR-BUILDERS.md](./FOR-BUILDERS.md) describes what a real builder's version would involve.

## Development

```bash
yarn install
yarn dev     # http://localhost:3000
yarn test    # Jest
yarn build   # production build
```
