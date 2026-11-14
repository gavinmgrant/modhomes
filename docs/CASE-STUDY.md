# ModHomes: a product case study

ModHomes is a concept configurator for a made-up modular home builder. Buyers configure a home in 3D, walk through it, see it on a lot, watch the price follow every choice, and reserve it. This page is about the product side: the problem it takes on, who it's for, the decisions behind it and what I'd measure. [ARCHITECTURE.md](./ARCHITECTURE.md) covers how it's built, and [FOR-BUILDERS.md](./FOR-BUILDERS.md) covers what it would take for a real builder.

Try it at [modhomes.vercel.app](https://modhomes.vercel.app/).

## The problem

I've seen modular homes from three sides. I designed prefab homes on Marmol Radziner's prefab team, worked in sales at Connect Homes helping buyers understand what a modular home would cost and take to build, and since 2020 I've built web software.

Most modular builders that sell online show a starting price and some photos, then hand buyers to a salesperson for everything else. The questions buyers bring to that first conversation are the same ones every time:

- What will my home cost, with the options I want?
- What will it look and feel like inside?
- How does it get to my lot, and what does that cost?
- When could I move in?

Until those are answered, a buyer can't tell whether the home is right for them, and the salesperson spends the first calls answering them by hand. ModHomes asks what it would look like if the website answered them first.

## Who it's for

A configurator for a builder has more than one user:

- **Buyers**, who want to see their home and know what it costs before they talk to anyone.
- **The builder's sales team**, who want leads that arrive knowing the price, with the home they configured attached.
- **The factory**, who'd rather start an order from an exact list of what's being built than from notes.
- **The builder's owner**, who'd pay for it and wants more qualified leads and fewer surprises late in a sale.

The demo has two audiences of its own: builders, to show what's possible, and employers, to show how I work. The pitch to builders is kept at the edges of the demo (the footer, the menu, and the confirmation after Reserve) so it never sits over the 3D views a buyer is using.

## Decisions and trade-offs

### Price the home from what it's built from

The usual online price is a starting price, or a price per square foot. ModHomes prices every home from its parts: the same code that draws the home counts its modules, glass panes, walls, stair, kitchen, baths and decks, and multiplies them by a rate card.

- **Why:** it's how a factory thinks about cost, and it means the price moves for the reasons it would in real life. A Mod 2x2 costs more than a Mod 4x1 with the same number of modules, because it has twice the glass, a stair and stacked modules.
- **Detail:** the price is shown in full dollars, so even a small upcharge moves it, and the floor finishes are priced outright so switching one can lower the price as well as raise it.
- **Trade-off:** it only works if the rate card matches the factory's real costs. For a real builder, that's the first thing to get right, and it's phase 1 of the plan in FOR-BUILDERS.md.

### Put the configured home in its URL

Every choice a buyer makes is written to the URL, like `/homes/mod3x2?metal=copper&floor=concrete&decks=left,right`. Only what differs from the defaults is written, so links stay short.

- **Why:** a link is the simplest way for a buyer to save a home, send it to a partner, or hand it to a salesperson, and it needs no accounts or database. A link can also open the home straight inside (`?view=inside`), so a salesperson can send a walk-through.
- **Trade-off:** nothing is saved on a server, so the builder can't see configurations nobody shares. A real version would also save each one with an ID and send it to the CRM as a lead.

### Show the whole price at checkout

Reserve opens a checkout with every line of the price by group, then delivery from the factory, the crane, the set, a 10% deposit and a schedule from reserving to moving in.

- **Why:** delivery and timing are where modular buyers get surprised. Showing them as lines, with quantities and rates, makes it clear what drives the total.
- **Trade-off:** real delivery depends on the route, permits and site, so a real checkout would show those as a range until a site visit. FOR-BUILDERS.md says so plainly rather than overpromising.

### Show the home where it would stand

The Site view stands the home on Google's photorealistic 3D imagery of a real lot in Palm Springs, among the neighbors' houses and trees.

- **Why:** buyers aren't buying a home in a void. Seeing it on a lot answers "will it look right there?" in a way photos can't.
- **Constraints I designed around:**
  - **Terms:** Google's terms don't allow measuring or tracing from the imagery, so lot size and slope would have to come from parcel and zoning data, not the 3D view.
  - **Cost:** the tiles are billed per visit, so the view is capped at 32 visits a day to stay in the free tier, and it falls back to a plain sky if the cap is hit or the tiles fail.
  - **Data quality:** the first lot I tried still had a house standing on it in Google's imagery, even though it was vacant in recent aerial photos, so I chose another.
- **What I left out:** inside, the tiles look smeared from the ground, so the inside view uses a landscape photo instead. Quality won over consistency.

### Make it work on a phone

A buyer's first look at a builder is often on a phone, and a configurator that stutters there loses them.

- The 3D views draw only when something changes, so a home that's sitting still costs nothing.
- The landing page's spinning model cards share one 3D canvas instead of one each.
- The kitchens' hundreds of parts are drawn in about a dozen batches.
- On a phone, the model card starts closed, showing only the name, price and Reserve.

### Keep the controls few

- A Deck button adds a deck to whichever glass side faces the camera, so there's no left/right picker to learn.
- The outside view opens at eye level, the way a buyer would see the home walking up, rather than from above like a model on a table.
- The model card's area and price count up together over a fixed 0.8 seconds, so they land at the same moment however big the change.
- Dots on the kitchen appliances open their real model and specs, since "which appliances?" is a question buyers ask.

### Be honest that it's a demo

Every place a buyer could be misled says it's a concept: the README, the footer and the checkout. Reserving takes no payment and saves nothing. A demo that looks like a real store, for a builder that doesn't exist, would do more harm than good.

## Scope

I first built ModHomes in December 2022 as a simple 3D viewer: models, siding colors and a floor finish. In late October 2026 I rebuilt it around the questions above, in 72 commits over about two weeks: the walk-through, the kitchens, baths and bedrooms, pricing, the Site view, checkout, and the pitch to builders.

What I deliberately left out, because a demo doesn't need it and a real builder would shape it:

- accounts, a database and a CRM connection
- real payments and deposit terms
- any address a buyer enters, with its parcel, zoning and setbacks
- a parts list and model for the factory
- editing prices without a code change

FOR-BUILDERS.md orders these into four phases, each useful on its own, so a builder could stop after any of them.

## What I'd measure

ModHomes has no analytics today, since it has no real buyers. For a builder, these are the numbers I'd want, in order of how much they matter to the business:

1. **Lead quality.** The share of leads that arrive with a configured home, and how long those take to close compared with leads that don't.
2. **Price surprise.** How far the signed contract price lands from the configured price. The goal is a small, predictable gap.
3. **Reservations or quote requests** per visitor who configures a home.
4. **Engagement on the way there.** How many visitors change a finish, go inside, add a deck or open the Site view, and where they drop off.
5. **Sharing.** How many configured links are opened by someone other than the person who made them.

The first two would tell a builder whether the configurator is worth its cost. The rest would tell us what to improve.

## How I work

I build with AI coding tools like Claude Code, credited in the commit history. I set the direction: what the product should do, for whom, and what good looks like. I review what's built against that, and I own the result. The work is checked by about 300 unit tests, and every part is written up in [ARCHITECTURE.md](./ARCHITECTURE.md), including why it was built that way and what would change for a real builder.

There's more about me at [gavingrant.com](https://www.gavingrant.com) and on [LinkedIn](https://www.linkedin.com/in/gavinmgrant/), and you can email me at [gavin@gavingrant.com](mailto:gavin@gavingrant.com).
