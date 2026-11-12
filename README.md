# ModHomes

**What your modular homes could look like in the browser.**

> [!IMPORTANT]
> **ModHomes is a demo for a made-up builder.** I built it to show modular home builders what's possible online. No homes are for sale. The factory, prices, delivery costs and schedules are invented, and reserving a home takes no payment and saves nothing. Imagine it with your homes.

**[Try the live demo →](https://modhomes.vercel.app/)**

![A two-story ModHomes home in white metal siding with dark trim and covered walnut decks, its model card showing its specs and price as configured](docs/images/outside.png)

## What your buyers could do

**Configure the home in 3D.** Buyers orbit the home, pick its siding, trim and wood colors, and crane covered decks onto its glass sides. The price on the card updates with every choice, priced from what the home is built from.

**Walk through it before it's built.** They step inside and walk past the kitchen, baths, stair and bedrooms in first person. They can try floor finishes and tile colors, and tap the appliances to see their specs.

![Inside a ModHomes home: a kitchen island with stools, an open stair, and a desert landscape through the sliding glass](docs/images/inside.jpg)

**See it on a real lot.** The Site view stands the home on Google's photorealistic 3D imagery of a lot in Palm Springs, among the neighbors' houses and trees.

**Compare every model.** The landing page shows each model turning in 3D, with its size, beds, baths and starting price.

![The landing page's grid of eight models, from a one-module studio to a two-story, four-bedroom home](docs/images/models.png)

**Reserve it.** The checkout shows the home as configured with every line of its price, delivery from the factory to the lot, the deposit, and when the home would be ready to move in.

![The checkout: the configured home's finishes, and its price line by line, with delivery and the schedule](docs/images/checkout.png)

## Try these homes

A configured home lives in its URL, so it can be shared, and a link can open it outside or straight inside. These are ready to look around:

* [Mod 3x2 in copper and walnut, with decks on both sides](https://modhomes.vercel.app/homes/mod3x2?metal=copper&wood=walnut&decks=left,right)
* [Walk through a Mod 3x2 with concrete floors, starting in its kitchen](https://modhomes.vercel.app/homes/mod3x2?floor=concrete&decks=left,right&view=inside)
* [Mod 5x1 in gray and charcoal, with concrete floors and a deck](https://modhomes.vercel.app/homes/mod5x1?metal=grey&trim=charcoal-gray&floor=concrete&tile=chalkboard&decks=right)
* [Mod 2x2 in taupe, with bamboo floors](https://modhomes.vercel.app/homes/mod2x2?metal=taupe&floor=bamboo&decks=left)
* [The checkout for the copper Mod 3x2](https://modhomes.vercel.app/homes/mod3x2/checkout?metal=copper&wood=walnut&decks=left,right)

## What it could do for your sales

* **Buyers who know the price** before they contact you.
* **A link to every configuration** that your salesperson can open, sent to your CRM as a lead.
* **Fewer surprises**, because buyers walk through the home and see its finishes before they sign.
* **A home on the buyer's own lot**, with a check that it fits.
* **A head start for the factory**, since the model that draws the home also counts what it's built from.

## Bring your homes to the browser

To do this for your homes, I'd work from your plans, options, prices, factories and sales process. It can be built in phases: your homes and prices first, then your buyers' lots, then the hand-off to your factory, then the whole purchase. It sits in front of the tools you already use: your website, CRM, pricing and design models.

The live site has a short version at [modhomes.vercel.app/builders](https://modhomes.vercel.app/builders). [docs/FOR-BUILDERS.md](./docs/FOR-BUILDERS.md) covers what I'd need from you, how it fits your tools, each phase, its limits and what it costs to run.

## How it's built

Every home is generated in code from steel-framed modules, with no imported 3D models, and drawn with architectural linework. The price is counted from the same geometry that draws the home, so every pane, wall and deck is priced. The 3D views draw only when something changes, so they stay light on phones. [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) explains how it all works, and which parts would change for another builder's homes.

* TypeScript, React and Next.js
* React Three Fiber, drei and three.js for the 3D scenes
* Material UI for the interface
* Framer Motion for animation
* Jest and React Testing Library for tests
* Vercel for hosting

## Get in touch

If you build modular homes and want to see yours in the browser, email me at [gavin@gavingrant.com](mailto:gavin@gavingrant.com).

## Running it locally

* Clone this repository to your local computer.
* Install the dependencies for the project: `yarn install`
* Run the application locally: `yarn dev`
* Open `http://localhost:3000/` in your browser.
* Run the tests: `yarn test`

### Site view (optional)

The viewer's Site switch stands a home on Google's photorealistic 3D tiles of its lot. It only appears when a Google Maps key is set. Enable the Map Tiles API on your Cloud project, then copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_GOOGLE_MAPS_KEY` with a key for that API. The key is sent from the browser, so restrict it in the Cloud console to the site's domains and to that API, and cap the API's daily root tile set requests to stay within the free tier. The Site view section of [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) has the details.
