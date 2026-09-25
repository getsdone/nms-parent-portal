import { useEffect, useState } from "react";
import { api } from "../api";

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

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCents(cents: number): string {
  return currency.format(cents / 100);
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
      <div>
        <h1>Budget</h1>
        <p>Loading…</p>
      </div>
    );
  }

  if (status.kind === "not-found") {
    return (
      <div>
        <h1>Budget</h1>
        <p>No budget on file for this family.</p>
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div>
        <h1>Budget</h1>
        <p>{status.message}</p>
      </div>
    );
  }

  const budget = status.budget;
  const percentUsed =
    budget.allocated_cents === 0
      ? 0
      : (budget.spent_cents / budget.allocated_cents) * 100;

  return (
    <div>
      <h1>Budget — FY{budget.fiscal_year}</h1>
      <dl>
        <dt>Allocated</dt>
        <dd>{formatCents(budget.allocated_cents)}</dd>
        <dt>Spent</dt>
        <dd>{formatCents(budget.spent_cents)}</dd>
        <dt>Remaining</dt>
        <dd>{formatCents(budget.remaining_cents)}</dd>
      </dl>
      {budget.allocated_cents === 0 ? (
        <p>No allocation</p>
      ) : (
        <>
          <label htmlFor="budget-progress">Budget spent</label>
          <progress
            id="budget-progress"
            value={budget.spent_cents}
            max={budget.allocated_cents}
          />
          <span>{percentUsed.toFixed(0)}%</span>
        </>
      )}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Vendor</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {budget.transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.occurred_on}</td>
              <td>{transaction.vendor}</td>
              <td>{transaction.category}</td>
              <td>{transaction.description}</td>
              <td>{formatCents(transaction.amount_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
