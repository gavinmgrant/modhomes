// The kitchen appliances that come with each home, shown in the spec
// dots on them in the inside view. They're all Bosch, a matching stainless
// suite: the 800 Series where Bosch makes one, and its 500 Series 24"
// bottom-freezer fridge for the two-wide homes' galley. Each appliance's
// standard model is listed on its own so upgrade options can sit beside it
export type ApplianceId =
  "range" | "hood" | "dishwasher" | "frenchDoorFridge" | "bottomFreezerFridge";

export interface Product {
  brand: string;
  series: string;
  name: string;
  model: string;
  // two or three short facts, most telling first
  specs: string[];
  url: string;
}

export interface Appliance {
  kind: string;
  standard: Product;
}

const BOSCH = "https://www.bosch-home.com/us/en";

export const APPLIANCES: Record<ApplianceId, Appliance> = {
  range: {
    kind: "Range",
    standard: {
      brand: "Bosch",
      series: "800 Series",
      name: 'Induction Slide-in Range, 30"',
      model: "HII8057U",
      specs: [
        "4 induction elements",
        "4.6 cu ft convection oven",
        "Warming drawer",
      ],
      url: `${BOSCH}/product/cooking-baking/slide-in-ranges/induction-slide-in-ranges/HII8057U`,
    },
  },
  hood: {
    kind: "Range hood",
    standard: {
      brand: "Bosch",
      series: "800 Series",
      name: 'Undercabinet Hood, 30"',
      model: "DUH80553UC",
      specs: ["600 CFM", "4 fan speeds", "LED lights"],
      url: `${BOSCH}/product/cooking-baking/ventilation/built-in-cooker-hoods/DUH80553UC`,
    },
  },
  dishwasher: {
    kind: "Dishwasher",
    standard: {
      brand: "Bosch",
      series: "800 Series",
      name: 'Bar Handle Dishwasher, 24"',
      model: "SHX78CM5N",
      specs: ["42 dBA", "16 place settings", "CrystalDry"],
      url: `${BOSCH}/product/dishwashers/top-controls/SHX78CM5N`,
    },
  },
  frenchDoorFridge: {
    kind: "Refrigerator",
    standard: {
      brand: "Bosch",
      series: "800 Series",
      name: 'French Door Bottom Mount Refrigerator, 36"',
      model: "B36CT80SNS",
      specs: ["Counter depth", "20.8 cu ft", "Ice maker and filtered water"],
      url: `${BOSCH}/product/refrigerators/french-door/freestanding/B36CT80SNS`,
    },
  },
  bottomFreezerFridge: {
    kind: "Refrigerator",
    standard: {
      brand: "Bosch",
      series: "500 Series",
      name: 'Bottom Freezer Refrigerator, 24"',
      model: "B24CB50ESS",
      specs: ["Counter depth", "12.8 cu ft", "VitaFresh drawer"],
      url: `${BOSCH}/product/refrigerators/fridge-freezers/freestanding-fridge-freezers-with-freezer-at-bottom/B24CB50ESS`,
    },
  },
};
