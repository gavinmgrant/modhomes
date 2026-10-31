import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  ApplianceCard,
  SpecsToggle,
  getSpotOpacity,
  SPOT_RANGE,
} from "../components/hotspots";
import {
  getApplianceSpots,
  getGalleyLayout,
  getServicesLayout,
} from "../components/services";
import type { Spot } from "../components/kitchen";
import { APPLIANCES } from "../lib/appliances";
import { loadHotspotsSeen, saveHotspotsSeen } from "../lib/hotspotsseen";

const appliancesIn = (cols: number) =>
  getApplianceSpots(cols)
    .map((spot) => spot.appliance)
    .sort();

describe("appliance spots", () => {
  it("dots the kitchens' range, hood, dishwasher and fridge", () => {
    expect(appliancesIn(1)).toEqual([]);
    expect(appliancesIn(2)).toEqual(
      ["bottomFreezerFridge", "dishwasher", "hood", "range"].sort(),
    );
    [3, 4].forEach((cols) =>
      expect(appliancesIn(cols)).toEqual(
        ["dishwasher", "frenchDoorFridge", "hood", "range"].sort(),
      ),
    );
  });

  // Just behind each dot, back toward its appliance, is the appliance's
  // own stainless front, or the range's dark oven door
  it.each([2, 3, 4])(
    "sits each dot on its appliance's front, %i wide",
    (cols) => {
      const layout = getServicesLayout(cols) ?? getGalleyLayout(cols)!;
      const step: Record<Spot["facing"], [number, number]> = {
        "+x": [-0.02, 0],
        "-x": [0.02, 0],
        "+z": [0, -0.02],
        "-z": [0, 0.02],
      };
      getApplianceSpots(cols).forEach(({ appliance, position, facing }) => {
        const [dx, dz] = step[facing];
        const point = [
          position[0] - layout.moduleX + dx,
          position[1],
          position[2] + dz,
        ];
        const holders = layout.fixtures.filter(
          ({ finish, position: middle, size }) =>
            (finish === "stainless" || finish === "cooktop") &&
            point.every(
              (value, i) => Math.abs(value - middle[i]) <= size[i] / 2 + 1e-6,
            ),
        );
        expect({ appliance, found: holders.length > 0 }).toEqual({
          appliance,
          found: true,
        });
      });
    },
  );

  it("stacks the hood's dot over the range's", () => {
    [2, 3].forEach((cols) => {
      const spots = getApplianceSpots(cols);
      const range = spots.find((spot) => spot.appliance === "range")!;
      const hood = spots.find((spot) => spot.appliance === "hood")!;
      expect(hood.position[1]).toBeGreaterThan(range.position[1] + 2);
      expect(hood.facing).toBe(range.facing);
    });
  });
});

describe("spot visibility", () => {
  const spot: Spot = {
    appliance: "range",
    position: [0, 0, 0],
    facing: "-z",
  };

  it("shows a nearby dot seen from in front of its appliance", () => {
    expect(getSpotOpacity(spot, [0, -8])).toBe(1);
    expect(getSpotOpacity(spot, [3, -8])).toBe(1);
  });

  it("hides it from behind and side on, so it doesn't show through walls", () => {
    expect(getSpotOpacity(spot, [0, 8])).toBe(0);
    expect(getSpotOpacity(spot, [8, 0])).toBe(0);
    expect(getSpotOpacity(spot, [8, -0.5])).toBe(0);
  });

  it("fades it out with distance", () => {
    const middle = (SPOT_RANGE.near + SPOT_RANGE.far) / 2;
    expect(getSpotOpacity(spot, [0, -middle])).toBeCloseTo(0.5);
    expect(getSpotOpacity(spot, [0, -SPOT_RANGE.far - 1])).toBe(0);
  });
});

describe("appliance catalogue", () => {
  it("lists a model, a few specs and a product page for each", () => {
    Object.values(APPLIANCES).forEach(({ standard }) => {
      expect(standard.model).toMatch(/^[A-Z0-9]+$/);
      expect(standard.specs.length).toBeGreaterThanOrEqual(2);
      expect(standard.specs.length).toBeLessThanOrEqual(3);
      expect(standard.url).toMatch(/^https:\/\/www\.bosch-home\.com\//);
      expect(standard.url).toContain(standard.model);
    });
  });
});

describe("ApplianceCard", () => {
  it("shows the standard model's details and a link to its page", () => {
    render(
      <ApplianceCard
        id="card"
        appliance={APPLIANCES.range}
        onClose={() => {}}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "Bosch 800 Series" });
    expect(dialog).toHaveTextContent("Range");
    expect(dialog).toHaveTextContent("Standard");
    expect(dialog).toHaveTextContent("Model HII8057U");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    const link = screen.getByRole("link", { name: /View at Bosch/ });
    expect(link).toHaveAttribute("href", APPLIANCES.range.standard.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("closes from its close button", () => {
    const onClose = jest.fn();
    render(
      <ApplianceCard id="card" appliance={APPLIANCES.hood} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("SpecsToggle", () => {
  it("switches the dots on and off", () => {
    const onChange = jest.fn();
    const { rerender } = render(<SpecsToggle on onChange={onChange} />);
    const button = screen.getByRole("button", { name: "Product specs" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    expect(onChange).toHaveBeenLastCalledWith(false);
    rerender(<SpecsToggle on={false} onChange={onChange} />);
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(onChange).toHaveBeenLastCalledWith(true);
  });
});

describe("pulse", () => {
  it("is remembered as seen for the rest of the visit", () => {
    window.sessionStorage.clear();
    expect(loadHotspotsSeen()).toBe(false);
    saveHotspotsSeen();
    expect(loadHotspotsSeen()).toBe(true);
  });
});
