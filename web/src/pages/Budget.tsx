import { useEffect, useState } from "react";
import { api } from "../api";
import { formatCents, formatMonthDay, parseDateOnly } from "../components/format";

interface Transaction {
  id: number;
  occurred_on: string;
  vendor: string;
  category: string | null;
  amount_cents: number;
  description: string | null;
}

interface BudgetSummary {
  fiscal_year: number;
  allocated_cents: number;
  spent_cents: number;
  remaining_cents: number;
  transactions: Transaction[];
}

type Status =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "not-found" }
  | { kind: "ready"; budget: BudgetSummary };

export default function Budget() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    api<BudgetSummary>("/budget")
      .then((budget) => setStatus({ kind: "ready", budget }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("404")) {
          setStatus({ kind: "not-found" });
        } else {
          setStatus({ kind: "error", message });
        }
      });
  }, []);

  if (status.kind === "loading") {
    return (
      <div className="page">
        <h1 className="page__title">Budget</h1>
        <p className="notice">Loading…</p>
      </div>
    );
  }

  if (status.kind === "not-found") {
    return (
      <div className="page">
        <h1 className="page__title">Budget</h1>
        <p className="empty">No budget on file for this family.</p>
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div className="page">
        <h1 className="page__title">Budget</h1>
        <p className="alert">{status.message}</p>
      </div>
    );
  }

  const budget = status.budget;
  const percentUsed =
    budget.allocated_cents === 0
      ? 0
      : (budget.spent_cents / budget.allocated_cents) * 100;

  return (
    <div className="page">
      <header>
        <h1 className="page__title">Budget</h1>
        <p className="page__lede">FY{budget.fiscal_year}</p>
      </header>
      <section className="card card--hero budget-hero" aria-label="Budget summary">
        <div>
          <p className="budget-hero__amount">{formatCents(budget.remaining_cents)}</p>
          <p className="budget-hero__sub">
            left to spend of {formatCents(budget.allocated_cents)} this year
          </p>
        </div>
        {budget.allocated_cents === 0 ? (
          <p className="empty">No allocation</p>
        ) : (
          <div className="progress">
            <label htmlFor="budget-progress">Budget spent</label>
            <progress
              id="budget-progress"
              value={budget.spent_cents}
              max={budget.allocated_cents}
            />
            <span className="progress__value">{percentUsed.toFixed(0)}%</span>
          </div>
        )}
        <ul className="legend">
          <li className="legend__item legend__item--spent">
            Spent <strong>{formatCents(budget.spent_cents)}</strong>
          </li>
          <li className="legend__item legend__item--left">
            Left <strong>{formatCents(budget.remaining_cents)}</strong>
          </li>
        </ul>
      </section>

      <section className="section">
        <h2 className="section__title">Recent activity</h2>
        {budget.transactions.length === 0 ? (
          <p className="empty">No spending yet.</p>
        ) : (
          <ul className="list">
            {budget.transactions.map((transaction) => (
              <li key={transaction.id} className="list__row activity">
                <div className="activity__main">
                  <p className="list__title">
                    {transaction.description ?? transaction.vendor}
                  </p>
                  <p className="list__meta">
                    {formatMonthDay(parseDateOnly(transaction.occurred_on))}
                    {transaction.category && ` · ${transaction.category}`}
                  </p>
                </div>
                <span className="activity__amount">{formatCents(transaction.amount_cents)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
