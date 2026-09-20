import { describe, expect, it } from "vitest";
import { addDays } from "../lib/dates";
import {
  cycleContaining, cycleLabel, cycleShortLabel, daysBetween, MONTHS_PER_YEAR,
  recentCycles, recentYears, shiftCycle, shiftYear, yearContaining, yearLabel,
} from "./months";

const START_DAYS = [1, 5, 15, 25, 28];

describe("monthly cycles", () => {
  it("runs a calendar month when the month starts on the 1st", () => {
    expect(cycleContaining("2026-09-20", 1)).toMatchObject({ from: "2026-09-01", to: "2026-09-30" });
    expect(cycleContaining("2024-02-29", 1)).toMatchObject({ from: "2024-02-01", to: "2024-02-29" });
  });

  it("runs salary day to the day before the next one", () => {
    expect(cycleContaining("2026-09-20", 20)).toMatchObject({ from: "2026-09-20", to: "2026-10-19" });
    expect(cycleContaining("2026-09-19", 20)).toMatchObject({ from: "2026-08-20", to: "2026-09-19" });
  });

  it("tiles the calendar: every day is in exactly one cycle, with no gap to the next", () => {
    START_DAYS.forEach((startDay) => {
      for (let date = "2024-12-20"; date <= "2026-03-10"; date = addDays(date, 1)) {
        const cycle = cycleContaining(date, startDay);
        expect(date >= cycle.from && date <= cycle.to).toBe(true);
        expect(shiftCycle(cycle, startDay, 1).from).toBe(addDays(cycle.to, 1));
        expect(shiftCycle(cycle, startDay, -1).to).toBe(addDays(cycle.from, -1));
      }
    });
  });

  it("lists the recent cycles oldest first, ending with today's", () => {
    const cycles = recentCycles("2026-09-20", 1, 3);
    expect(cycles.map((c) => c.from)).toEqual(["2026-07-01", "2026-08-01", "2026-09-01"]);
  });

  // The month name itself comes from the platform's locale data ("Sep" or "Sept").
  it("names a cycle by its month, or by its two ends", () => {
    expect(cycleLabel(cycleContaining("2026-09-20", 1), 1)).toBe("September 2026");
    expect(cycleLabel(cycleContaining("2026-09-20", 20), 20)).toMatch(/^20 Sept? – 19 Oct 2026$/);
    expect(cycleShortLabel(cycleContaining("2026-09-20", 1))).toMatch(/^Sept?$/);
    expect(cycleShortLabel(cycleContaining("2026-01-05", 1))).toBe("Jan '26");
  });
});

describe("years", () => {
  it("is twelve cycles starting with January's", () => {
    expect(yearContaining("2026-09-20", 1)).toMatchObject({ from: "2026-01-01", to: "2026-12-31" });
    expect(yearContaining("2026-09-20", 20)).toMatchObject({ from: "2026-01-20", to: "2027-01-19" });
    expect(yearContaining("2026-01-10", 20)).toMatchObject({ from: "2025-01-20", to: "2026-01-19" });
  });

  it("holds exactly twelve cycles, end to end", () => {
    START_DAYS.forEach((startDay) => {
      const year = yearContaining("2026-06-15", startDay);
      const cycles = recentCycles(year.to, startDay, MONTHS_PER_YEAR);
      expect(cycles[0].from).toBe(year.from);
      expect(cycles[MONTHS_PER_YEAR - 1].to).toBe(year.to);
    });
  });

  it("tiles the calendar the same way", () => {
    START_DAYS.forEach((startDay) => {
      const year = yearContaining("2026-06-15", startDay);
      expect(shiftYear(year, startDay, 1).from).toBe(addDays(year.to, 1));
      expect(shiftYear(year, startDay, -1).to).toBe(addDays(year.from, -1));
    });
  });

  it("lists the recent years oldest first and names them", () => {
    expect(recentYears("2026-09-20", 1, 3).map((y) => yearLabel(y, 1))).toEqual(["2024", "2025", "2026"]);
    expect(yearLabel(yearContaining("2026-09-20", 20), 20)).toBe("2026–27");
  });
});

describe("daysBetween", () => {
  it("counts both ends", () => {
    expect(daysBetween("2026-09-20", "2026-09-20")).toBe(1);
    expect(daysBetween("2026-09-01", "2026-09-30")).toBe(30);
    expect(daysBetween("2024-02-01", "2024-03-01")).toBe(30);   // leap year
  });
});
