import { Link } from "react-router-dom";
import type { BudgetSummary } from "./types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCents(cents: number): string {
  return currency.format(cents / 100);
}

interface BudgetSummaryLineProps {
  budget: BudgetSummary;
}

export default function BudgetSummaryLine({ budget }: BudgetSummaryLineProps) {
  if (budget.fiscal_year === null) {
    return <p className="empty">No budget set up yet.</p>;
  }
  return (
    <p className="nudge">
      {formatCents(budget.remaining_cents)} remaining, {budget.percent_used}% used.{" "}
      <Link to="/budget">See budget</Link>
    </p>
  );
}
