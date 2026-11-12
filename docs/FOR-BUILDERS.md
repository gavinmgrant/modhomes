# Bringing your homes to the browser

ModHomes is a demo I built for a made-up modular home builder. It shows what buying a modular home online could feel like: your buyers configure a home in 3D, walk through it, see it on a lot, watch its price change as they go, and reserve it. This page is for builders. It describes what it would take to do the same for your homes, what I'd need from you, and what to expect.

Try the demo at [modhomes.vercel.app](https://modhomes.vercel.app/), and see the [README](../README.md) for what it does. The live site has a short version of this page at [modhomes.vercel.app/builders](https://modhomes.vercel.app/builders).

## Why it's worth doing

Most modular and prefab builders that sell online today show a starting price and a few photos, then pass buyers to a salesperson for the rest. A few go further. [Plant Prefab](https://www.plantprefab.com/press-center/new-livinghome-9-11-12) has a real-time 3D configurator with over 75 options. [Villa](https://www.dwell.com/article/villa-prefab-california-adu-builder-backyard-homes-0d286d46) updates costs live and shows the home on the buyer's property. [Higharc](https://higharc.com/product/showroom) sells production builders a 3D configurator with live pricing to embed on their sites.

A configurator like ModHomes could help your sales in a few ways:

- **Buyers who know the price.** A price that updates with every choice means the buyers who contact you have already seen what their home costs.
- **Configurations your team can open.** Every home a buyer configures has its own link. Sent to your CRM, it's a lead your salesperson can open to see exactly what they picked.
- **Fewer surprises.** Buyers walk through the home and see the finishes before they sign, not after.
- **A home on their lot.** Buyers see the home standing on their own land, and could be told whether it fits.
- **A head start for the factory.** The same model that draws the home counts what it's built from, which could become the order's parts list.

## What I'd need from you

- **Your homes.** Plans and elevations for each model, and drawings or a model of how the modules are built: BIM, CAD or PDFs.
- **Your options.** Every finish, upgrade and package a buyer can pick, which ones go together, and which ones your engineering rules out.
- **Your prices.** Base prices and what each option adds, or the costs and margins behind them. They could come from your CPQ or ERP if you have one.
- **Where you build and deliver.** Your factories, the states and counties you serve, how you quote delivery, set and site work, and your approved plan sets.
- **How you sell.** Your CRM, whether you take a reservation deposit and on what terms, and who follows up with a buyer.
- **Your brand.** Logo, fonts, colors and photography.

## How it would fit your tools

It's meant to sit in front of the systems you already use, not to replace them:

- **Your website.** On a domain of its own, or embedded in your current site.
- **Your CRM.** Each saved configuration is sent to HubSpot, Salesforce or whatever you use, as a lead with its link and price.
- **Your pricing.** Prices could live in the configurator, edited by your staff, or come from your CPQ or ERP, so there's one price list.
- **Your design model.** The 3D homes are generated in code, which keeps them fast in a browser. They can be kept in step with your Revit, Archicad or Grasshopper models, export a parts list or an IFC model for your design team, or be driven by your model directly.

## In phases

Each phase is useful on its own, so you can stop after any of them.

1. **Your homes, your prices.**
   - Your models, options and finishes in 3D, outside and in, with your brand.
   - Prices that your staff can edit, priced on the server.
   - Saved configurations sent to your CRM.
   - Reserve becomes a quote request, or a refundable deposit with your terms.
2. **Your buyers' lots.**
   - Buyers enter their address and see the home on it.
   - The configurator looks up the parcel's zoning and checks the home fits its setbacks.
   - Delivery is estimated from your nearest factory by road.
3. **To your factory.**
   - Every option is checked against your engineering's rules.
   - Each order exports a parts list, and a model your design team can open.
4. **The whole purchase.**
   - Schedules from your factory's real backlog and local permit times.
   - Financing estimates, or a hand-off to a lending partner.
   - Buyers follow their order from reservation to move-in.

## What it can't promise

- **Prices are estimates.** A configurator gives a price for the home. The purchase agreement sets the final one, as it does today.
- **Delivery and site work vary.** Trucking, permits, escorts and cranes are quoted per job. Until a site visit, the configurator would show a range.
- **Codes and approvals vary.** What a buyer can build depends on how your homes are certified and where they're going: state modular programs like [California's factory-built housing program](https://www.hcd.ca.gov/building-standards/mh/insignia/background), HUD's code, or local ADU rules. The configurator would only offer what your approved plans cover.
- **The lot view is for looking.** Google's 3D imagery can show any address, but [its terms](https://developers.google.com/maps/documentation/tile/policies) don't allow measuring the ground or tracing from it. A lot's size, setbacks and slope come from parcel and zoning data instead. Google's 3D imagery [isn't available to projects billed in the EU](https://developers.google.com/maps/comms/eea/map-tiles), so a European builder would use another provider.

## What it costs to run

Beyond building it, the running costs are small and grow with your traffic:

- **Hosting:** a standard web host, like Vercel, where the demo runs.
- **The lot view:** Google's 3D imagery is [free for the first 1,000 visits a month](https://developers.google.com/maps/billing-and-pricing/pricing), then $6 per 1,000. Each visit covers up to three hours of viewing.
- **Lot data:** parcel and zoning lookups are priced per lookup or by monthly plan, from providers like [Regrid](https://regrid.com/pricing) and [Zoneomics](https://www.zoneomics.com/pricing/api).
- **Deposits:** [Stripe](https://stripe.com/pricing) charges 0.8% capped at $5 for a bank (ACH) payment, so a $10,000 deposit costs $5 to take.

## Get in touch

If you build modular homes and want to see yours in the browser, email me at [gavin@gavingrant.com](mailto:gavin@gavingrant.com).
