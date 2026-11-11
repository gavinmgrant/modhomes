import React from "react";
import { ink } from "./panel";
import { LineItem, PRICE } from "../lib/pricing";
import { formatDate, Milestone, Order } from "../lib/delivery";

// The checkout's parts: the order's line items by group, its totals, and
// the schedule from reserving to moving in

const NUMBER = new Intl.NumberFormat("en-US");
// Units that read the same for any number of them
const MASS_UNITS = ["sq ft", "ft", "mi"];

// e.g. "1,920 sq ft × $14", "6 modules × $62,000"
export const formatQuantity = ({ quantity, unit, rate }: LineItem) => {
  const units = quantity === 1 || MASS_UNITS.includes(unit) ? unit : `${unit}s`;
  return `${NUMBER.format(quantity)} ${units} × ${PRICE.format(rate)}`;
};

// The groups in the order their first item comes
const groupItems = (items: LineItem[]) =>
  items.reduce<{ group: string; items: LineItem[] }[]>((groups, item) => {
    const last = groups[groups.length - 1];
    if (last?.group === item.group) last.items.push(item);
    else groups.push({ group: item.group, items: [item] });
    return groups;
  }, []);

const RULE = `1px solid ${ink(0.12)}`;

const Row = ({
  label,
  detail,
  amount,
  strong = false,
}: {
  label: string;
  detail?: string;
  amount: string;
  strong?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 16,
      padding: "6px 0",
      fontWeight: strong ? 600 : 400,
    }}
  >
    <div>
      <div style={{ fontSize: strong ? 16 : 14 }}>{label}</div>
      {detail && (
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{detail}</div>
      )}
    </div>
    <div
      style={{
        fontSize: strong ? 16 : 14,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      }}
    >
      {amount}
    </div>
  </div>
);

export const OrderBreakdown = ({ order }: { order: Order }) => (
  <div>
    {groupItems(order.items).map(({ group, items }) => (
      <section
        key={group}
        aria-label={group}
        style={{ borderBottom: RULE, padding: "12px 0" }}
      >
        <h3
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            opacity: 0.6,
            marginBottom: 4,
          }}
        >
          {group}
        </h3>
        {items.map((item) => (
          <Row
            key={item.id}
            label={item.label}
            // Not for one of a thing, or an included finish, which is its
            // quantity at no charge
            detail={
              item.amount && item.quantity !== 1
                ? formatQuantity(item)
                : undefined
            }
            amount={item.amount ? PRICE.format(item.amount) : "Included"}
          />
        ))}
      </section>
    ))}
    <div style={{ padding: "12px 0" }}>
      <Row label="Home" amount={PRICE.format(order.homeTotal)} />
      <Row
        label="Delivery and set"
        amount={PRICE.format(order.deliveryTotal)}
      />
      <Row label="Total" amount={PRICE.format(order.total)} strong />
    </div>
  </div>
);

export const Schedule = ({ milestones }: { milestones: Milestone[] }) => (
  <ol style={{ listStyle: "none" }}>
    {milestones.map(({ label, date }, i) => (
      <li
        key={label}
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          padding: "8px 0",
          borderTop: i ? RULE : undefined,
          fontSize: 14,
        }}
      >
        <span>{label}</span>
        <time dateTime={date} style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatDate(date)}
        </time>
      </li>
    ))}
  </ol>
);
