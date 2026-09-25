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

export default function Budget() {
  const [budget, setBudget] = useState<BudgetSummary | null>(null);

  useEffect(() => {
    api<BudgetSummary>("/budget").then(setBudget);
  }, []);

  if (!budget) {
    return <h1>Budget</h1>;
  }

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
      <progress value={budget.spent_cents} max={budget.allocated_cents}>
        {percentUsed.toFixed(0)}%
      </progress>
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
