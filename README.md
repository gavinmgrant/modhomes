# ModHomes

ModHomes renders configurable modular homes in 3D in the browser, built with Next.js and React Three Fiber. Watch a home assemble on the landing page, orbit any model from outside, change its color, or walk through it in first person and try different floor finishes. Each home is priced as configured, from what it's built from and the finishes picked. Reserve one to see its full price with delivery from the factory to the lot, and when it would be ready to move in. It's a concept: no payment is taken.

## Live App

See a live version of this app here: [modhomes.vercel.app](https://modhomes.vercel.app/).

## Technology

* TypeScript, React and Next.js
* React Three Fiber, drei and three.js for the 3D scenes
* Material UI for the interface
* Framer Motion for animation
* Jest and React Testing Library for tests
* Vercel for hosting

To learn how the app is structured and how the homes are generated, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Setup

* Clone this repository to your local computer.
* Install the dependencies for the project: `yarn install`
* Run the application locally: `yarn dev`
* Open `http://localhost:3000/` in your browser.
* Run the tests: `yarn test`

### Site view (optional)

The viewer's Site switch stands a home on Google's photorealistic 3D tiles of its lot. It only appears when a Google Maps key is set. Enable the Map Tiles API on your Cloud project, then copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_GOOGLE_MAPS_KEY` with a key for that API. The key is sent from the browser, so restrict it in the Cloud console to the site's domains and to that API, and cap the API's daily root tile set requests to stay within the free tier. The Site view section of [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) has the details.
