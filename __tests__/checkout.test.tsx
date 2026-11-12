import * as React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import type { GetServerSidePropsContext } from "next";
import mockRouter from "next-router-mock";
import Checkout, { getServerSideProps } from "../pages/homes/[home]/checkout";
import { formatQuantity } from "../components/checkout";
import { getOrder } from "../lib/delivery";
import { parseConfig } from "../lib/homeconfig";
import { PRICE } from "../lib/pricing";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("next/dist/client/router", () => require("next-router-mock"));

type Props = React.ComponentProps<typeof Checkout>;

// The page's props for a URL, as the server would make them
const propsFor = async (home: string, query: Record<string, string> = {}) => {
  const result = await getServerSideProps({
    params: { home },
    query,
  } as unknown as GetServerSidePropsContext);
  return result;
};

const renderCheckout = async (home: string, query: Record<string, string>) => {
  const result = await propsFor(home, query);
  const { props } = result as { props: Props };
  render(<Checkout {...props} />);
  return props;
};

describe("checkout", () => {
  beforeEach(() => mockRouter.setCurrentUrl("/homes/mod3x2/checkout"));
  afterEach(cleanup);

  it("reads the home from the URL on the server", async () => {
    const result = await propsFor("mod3x2", { floor: "concrete" });
    const { props } = result as { props: Props };
    expect(props.slug).toBe("mod3x2");
    expect(props.config).toEqual(parseConfig({ floor: "concrete" }));
    expect(props.schedule[0].label).toBe("Reserved");
    expect(await propsFor("mod9x9")).toEqual({ notFound: true });
  });

  it("shows the home as configured, its delivery and the total", async () => {
    const query = { metal: "copper", floor: "concrete", decks: "left" };
    await renderCheckout("mod3x2", query);
    const order = getOrder({ cols: 3, stories: 2, ...parseConfig(query) });
    expect(screen.getByText("Copper metal siding")).toBeTruthy();
    expect(screen.getByText("Concrete floor")).toBeTruthy();
    expect(screen.getByText("Covered decks")).toBeTruthy();
    expect(screen.getByText("Left side")).toBeTruthy();
    expect(screen.getByText("Oversize permits and escorts")).toBeTruthy();
    expect(screen.getByText(PRICE.format(order.total))).toBeTruthy();
    // with the same footer as the landing page
    expect(screen.getByText("Built by Gavin Grant")).toBeTruthy();
    // back to the same home in the configurator
    expect(
      screen.getByText("Change this home").closest("a")?.getAttribute("href"),
    ).toBe("/homes/mod3x2?metal=copper&floor=concrete&decks=left");
  });

  it("reserves for the deposit, with no payment, and confirms in a modal", async () => {
    await renderCheckout("mod2x1", {});
    const { deposit } = getOrder({ cols: 2, stories: 1, ...parseConfig({}) });
    expect(screen.getAllByText(/no payment is taken/)).toHaveLength(1);
    fireEvent.click(
      screen.getByRole("button", {
        name: `Reserve for ${PRICE.format(deposit)}`,
      }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Your Mod 2x1 is reserved",
    });
    const order = dialog.textContent!.match(/Order (MH-[0-9A-Z]{6})/)![1];
    expect(dialog.textContent).toContain(PRICE.format(deposit));
    expect(
      within(dialog).getByRole("link", { name: "Back to your home" }),
    ).toHaveAttribute("href", "/homes/mod2x1");
    expect(
      within(dialog).getByRole("link", {
        name: "See what this could do for yours",
      }),
    ).toHaveAttribute("href", "/builders");

    // closing it leaves the page reserved, with no second reservation
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitForElementToBeRemoved(() => screen.queryByRole("dialog"));
    expect(screen.queryByRole("button", { name: /Reserve for/ })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: `Reserved · Order ${order}` }),
    );
    expect(screen.getByRole("dialog").textContent).toContain(order);
  });

  it("writes each line's quantity and rate", () => {
    const line = {
      id: "floor",
      group: "Finishes" as const,
      label: "Concrete floor",
      unit: "sq ft",
    };
    expect(
      formatQuantity({ ...line, quantity: 1920, rate: 14, amount: 0 }),
    ).toBe("1,920 sq ft × $14");
    expect(
      formatQuantity({
        ...line,
        unit: "module",
        quantity: 6,
        rate: 62000,
        amount: 0,
      }),
    ).toBe("6 modules × $62,000");
  });
});
