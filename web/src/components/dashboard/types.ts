export interface TodoNudge {
  id: number;
  title: string;
  due_date: string | null;
  link: string | null;
}

export interface RsvpDeadline {
  id: number;
  title: string;
  rsvp_deadline: string;
  starts_at: string;
}

export interface UpcomingRsvp {
  id: number;
  title: string;
  starts_at: string;
  kind: "virtual" | "in_person";
  location: string | null;
}

export interface BudgetSummary {
  fiscal_year: number | null;
  allocated_cents: number;
  spent_cents: number;
  remaining_cents: number;
  percent_used: number;
}

export interface DashboardData {
  overdue_todos: TodoNudge[];
  due_soon_todos: TodoNudge[];
  upcoming_rsvps: UpcomingRsvp[];
  rsvp_deadlines: RsvpDeadline[];
  budget: BudgetSummary;
}
