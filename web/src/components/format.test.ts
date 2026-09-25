// Runs under several TZ values (see the "test:unit" script). Every assertion
// must hold in each of them, so dates are built from local components.
import { afterEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { daysFromToday, formatCents, parseDateOnly, plural } from "./format";

describe("formatCents", () => {
  it("drops the cents when the amount is whole dollars", () => {
    assert.equal(formatCents(500000), "$5,000");
    assert.equal(formatCents(200000), "$2,000");
    assert.equal(formatCents(300000), "$3,000");
    assert.equal(formatCents(100), "$1");
  });

  it("shows two decimals when there are cents", () => {
    assert.equal(formatCents(12345), "$123.45");
    assert.equal(formatCents(100050), "$1,000.50");
    assert.equal(formatCents(1), "$0.01");
    assert.equal(formatCents(5), "$0.05");
  });

  it("formats zero as $0", () => {
    assert.equal(formatCents(0), "$0");
  });

  it("formats an overspent (negative) amount with a leading minus", () => {
    assert.equal(formatCents(-20000), "-$200");
    assert.equal(formatCents(-150), "-$1.50");
  });

  it("groups millions", () => {
    assert.equal(formatCents(123456789), "$1,234,567.89");
  });
});

describe("parseDateOnly", () => {
  function ymd(d: Date) {
    return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
  }

  it(`yields the same calendar day at local midnight (TZ=${process.env.TZ ?? "unset"})`, () => {
    assert.deepEqual(ymd(parseDateOnly("2026-09-25")), [2026, 9, 25, 0, 0]);
  });

  it("differs from new Date() on the same string west of UTC", () => {
    // Guards the reason the helper exists: new Date("YYYY-MM-DD") is UTC midnight.
    const offsetMinutes = new Date(2026, 8, 25).getTimezoneOffset();
    const naive = new Date("2026-09-25");
    const expectedDay = offsetMinutes > 0 ? 24 : 25;
    assert.equal(naive.getDate(), expectedDay);
    assert.equal(parseDateOnly("2026-09-25").getDate(), 25);
  });

  it("handles year end, year start, and a leap day", () => {
    assert.deepEqual(ymd(parseDateOnly("2026-12-31")), [2026, 12, 31, 0, 0]);
    assert.deepEqual(ymd(parseDateOnly("2027-01-01")), [2027, 1, 1, 0, 0]);
    assert.deepEqual(ymd(parseDateOnly("2028-02-29")), [2028, 2, 29, 0, 0]);
  });

  it("handles the day clocks change for daylight saving", () => {
    assert.deepEqual(ymd(parseDateOnly("2026-11-01")), [2026, 11, 1, 0, 0]);
    assert.deepEqual(ymd(parseDateOnly("2027-03-14")), [2027, 3, 14, 0, 0]);
  });

  // Documents current behaviour: a full timestamp is cut to its first 10
  // characters, so the UTC date part wins over the local date.
  it("uses only the date part of a full ISO timestamp", () => {
    assert.deepEqual(ymd(parseDateOnly("2026-09-25T23:30:00Z")), [2026, 9, 25, 0, 0]);
    assert.deepEqual(ymd(parseDateOnly("2026-09-25T00:30:00+09:00")), [2026, 9, 25, 0, 0]);
  });

  // Documents current behaviour: no validation, an empty string is an Invalid Date.
  it("returns an Invalid Date for an empty string", () => {
    assert.ok(Number.isNaN(parseDateOnly("").getTime()));
  });
});

describe("daysFromToday and the late / due-in text", () => {
  afterEach(() => mock.timers.reset());

  function freeze(y: number, m: number, d: number, h = 10, min = 0) {
    mock.timers.enable({ apis: ["Date"], now: new Date(y, m - 1, d, h, min).getTime() });
  }

  // Same formulas as Dashboard's OverdueHero and TodoItem's dueText.
  const lateText = (due: string) => `${plural(-daysFromToday(due), "day")} late`;
  const dueInText = (due: string) => `Due in ${plural(daysFromToday(due), "day")}`;

  it("yesterday is -1 and reads 1 day late", () => {
    freeze(2026, 9, 24);
    assert.equal(daysFromToday("2026-09-23"), -1);
    assert.equal(lateText("2026-09-23"), "1 day late");
  });

  it("today is 0", () => {
    freeze(2026, 9, 24);
    assert.equal(daysFromToday("2026-09-24"), 0);
  });

  it("tomorrow is 1 and reads Due in 1 day", () => {
    freeze(2026, 9, 24);
    assert.equal(daysFromToday("2026-09-25"), 1);
    assert.equal(dueInText("2026-09-25"), "Due in 1 day");
  });

  it("7 days out is 7 and reads Due in 7 days", () => {
    freeze(2026, 9, 24);
    assert.equal(daysFromToday("2026-10-01"), 7);
    assert.equal(dueInText("2026-10-01"), "Due in 7 days");
  });

  it("14 days late reads 14 days late", () => {
    freeze(2026, 9, 24);
    assert.equal(lateText("2026-09-10"), "14 days late");
  });

  it("counts calendar days, not 24-hour periods, one minute before midnight", () => {
    freeze(2026, 9, 24, 23, 59);
    assert.equal(daysFromToday("2026-09-24"), 0);
    assert.equal(daysFromToday("2026-09-25"), 1);
  });

  it("counts calendar days one minute after midnight", () => {
    freeze(2026, 9, 25, 0, 1);
    assert.equal(daysFromToday("2026-09-24"), -1);
    assert.equal(daysFromToday("2026-09-25"), 0);
  });

  it("stays whole across the autumn daylight-saving change (25-hour day)", () => {
    freeze(2026, 10, 31, 12);
    assert.equal(daysFromToday("2026-11-07"), 7);
    assert.equal(daysFromToday("2026-11-01"), 1);
  });

  it("stays whole across the spring daylight-saving change (23-hour day)", () => {
    freeze(2027, 3, 13, 12);
    assert.equal(daysFromToday("2027-03-20"), 7);
    assert.equal(daysFromToday("2027-03-12"), -1);
  });

  it("crosses a year boundary", () => {
    freeze(2026, 12, 31);
    assert.equal(daysFromToday("2027-01-01"), 1);
    assert.equal(daysFromToday("2026-12-24"), -7);
  });
});

describe("plural", () => {
  it("uses the singular only for exactly 1", () => {
    assert.equal(plural(1, "day"), "1 day");
    assert.equal(plural(0, "day"), "0 days");
    assert.equal(plural(2, "day"), "2 days");
    assert.equal(plural(-1, "day"), "-1 days");
  });
});
