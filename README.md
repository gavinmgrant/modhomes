# ModHomes

ModHomes renders configurable modular homes in 3D in the browser, built with Next.js and React Three Fiber. Watch a home assemble on the landing page, orbit any model from outside, change its color, or walk through it in first person and try different floor finishes.

## Live App

See a live version of this app here: [modhomes.vercel.app](https://modhomes.vercel.app/).

## Technology

* TypeScript, React and Next.js
* React Three Fiber, drei and three.js for the 3D scenes
* Material UI for the interface
* Framer Motion and React Spring for animation
* Jest and React Testing Library for tests
* Vercel for hosting

To learn how the app is structured and how the homes are generated, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Setup

* Clone this repository to your local computer.
* Install the dependencies for the project: `yarn install`
* Run the application locally: `yarn dev`
* Open `http://localhost:3000/` in your browser.
* Run the tests: `yarn test`
