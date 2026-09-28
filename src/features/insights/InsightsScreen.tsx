/* Where the money went — the same sums seen from a month, a year or a decade away. */
import { useMemo } from "react";
import { FiPieChart, FiTarget } from "react-icons/fi";
import { href, type Route } from "../../app/router";
import { colorVars } from "../../data/categoryColors";
import {
  biggestExpenses, budgetStatus, busiestDays, byCategory, byDay, granularityFor,
  inRange, monthSeries, summarise, totalOf, trend, UNCATEGORISED_FILTER, UNCATEGORISED_NAME, yearSeries, yearsOfHistory,
  type CategorySlice,
} from "../../data/insights";
import { cycleContaining, daysBetween, shiftCycle } from "../../data/months";
import { isSingleCycle, PERIOD_PRESETS, PREVIOUS_LABELS, previousRange } from "../../data/periods";
import { settingsOf } from "../../data/settings";
import { useDB } from "../../data/store";
import { formatDate, formatDayLabel, todayISO } from "../../lib/dates";
import { formatMoney, formatMoneyShort, formatShare, plural, round2 } from "../../lib/format";
import { BarList, type BarItem } from "../../ui/BarList";
import { EmptyState } from "../../ui/feedback";
import { ListGroup, ListRow, PageHeader, SectionTitle, StatGrid, type Stat } from "../../ui/layout";
import { PeriodChips } from "../period/PeriodChips";
import { usePeriodFilter } from "../period/usePeriodFilter";
import { BudgetCard } from "./BudgetCard";
import { ChangeLine } from "./ChangeLine";
import { HeatMap } from "./HeatMap";
import { TrendChart } from "./TrendChart";
import styles from "./insights.module.css";

const TOP_LIST_LIMIT = 5;
const COMPARISON_MONTHS = 12;
const MAX_COMPARISON_YEARS = 10;

const TREND_TITLES = { day: "Day by day", month: "Month by month", year: "Year by year" } as const;

export function InsightsScreen({ route }: { route: Route }) {
  const db = useDB();
  const today = todayISO();
  const settings = settingsOf(db);
  const { monthStartDay, monthlyBudget } = settings;
  const period = usePeriodFilter(route, monthStartDay, PERIOD_PRESETS);

  const expenses = useMemo(() => inRange(db.expenses, period.range), [db.expenses, period.range]);
  const summary = useMemo(() => summarise(expenses, period.range, today), [expenses, period.range, today]);
  const slices = useMemo(() => byCategory(expenses, db.categories), [expenses, db.categories]);
  const granularity = useMemo(() => granularityFor(expenses, period.range), [expenses, period.range]);
  const points = useMemo(() => trend(expenses, period.range, granularity, monthStartDay), [expenses, period.range, granularity, monthStartDay]);
  const days = useMemo(() => byDay(expenses, period.range), [expenses, period.range]);

  const previous = useMemo(() => {
    const range = previousRange(period.range, period.preset, today, monthStartDay);
    return range ? totalOf(inRange(db.expenses, range)) : null;
  }, [db.expenses, period.range, period.preset, today, monthStartDay]);

  const lastMonthPerDay = useMemo(() => {
    const previousCycle = shiftCycle(cycleContaining(today, monthStartDay), monthStartDay, -1);
    const spent = totalOf(inRange(db.expenses, previousCycle));
    return spent ? round2(spent / daysBetween(previousCycle.from, previousCycle.to)) : 0;
  }, [db.expenses, today, monthStartDay]);

  const months = useMemo(() => monthSeries(db.expenses, today, monthStartDay, COMPARISON_MONTHS), [db.expenses, today, monthStartDay]);
  const historyYears = useMemo(() => yearsOfHistory(db.expenses, today, monthStartDay), [db.expenses, today, monthStartDay]);
  const years = useMemo(
    () => yearSeries(db.expenses, today, monthStartDay, Math.min(MAX_COMPARISON_YEARS, historyYears)),
    [db.expenses, today, monthStartDay, historyYears],
  );

  const singleCycle = isSingleCycle(period.range, monthStartDay);
  const running = today >= period.range.from && (!period.range.to || today <= period.range.to);

  if (!db.expenses.length) {
    return (
      <>
        <PageHeader title="Insights" />
        <EmptyState icon={<FiPieChart />} title="No spending to read yet" message="Add a few expenses and this fills with totals, trends and a month-by-month picture." />
      </>
    );
  }

  const busiest = busiestDays(days, TOP_LIST_LIMIT);
  const peakDay = busiest[0];
  const stats: Stat[] = [
    { label: "Spent", value: formatMoneyShort(summary.total), sub: plural(summary.count, "expense") },
    { label: "A day", value: formatMoneyShort(summary.dailyAverage), sub: `over ${plural(summary.daysElapsed, "day")}` },
    running && summary.daysLeft > 0
      ? { label: "On track for", value: formatMoneyShort(summary.projected), tone: "accent" as const, sub: `${plural(summary.daysLeft, "day")} left` }
      : { label: "Busiest day", value: formatMoneyShort(peakDay?.amount ?? 0), sub: peakDay ? formatDayLabel(peakDay.date) : "nothing spent" },
  ];

  const categoryBars: BarItem[] = slices.map((slice: CategorySlice) => ({
    key: slice.categoryId || UNCATEGORISED_FILTER,
    label: slice.name,
    value: slice.amount,
    color: colorVars(slice.color).ink,
    display: `${formatMoney(slice.amount)} · ${formatShare(slice.share)}`,
    href: href("history", {
      category: slice.categoryId || UNCATEGORISED_FILTER,
      period: period.preset,
      from: period.preset === "custom" ? period.range.from : null,
      to: period.preset === "custom" ? period.range.to : null,
    }),
  }));

  const categoryNames = new Map(db.categories.map((c) => [c.id, c.name]));
  const top = biggestExpenses(expenses, TOP_LIST_LIMIT);

  return (
    <>
      <PageHeader title="Insights" eyebrow={period.rangeLabel} />
      <PeriodChips filter={period} presets={PERIOD_PRESETS} />

      <StatGrid stats={stats} />
      {previous !== null && (
        <ChangeLine current={summary.total} previous={previous} label={PREVIOUS_LABELS[period.preset] ?? "the period before"} />
      )}

      {singleCycle && (
        <>
          <SectionTitle>Budget</SectionTitle>
          {monthlyBudget > 0 ? (
            <BudgetCard
              status={budgetStatus(summary.total, monthlyBudget, summary.daysTotal, summary.daysElapsed)}
              daysLeft={summary.daysLeft}
              lastMonthPerDay={lastMonthPerDay}
            />
          ) : (
            <EmptyState
              icon={<FiTarget />}
              title="No budget set"
              message="Set one and this shows what you can spend a day, how far ahead of that you are, and what is safe for the rest of the month."
              action={<a className={styles.budgetLink} href={href("more/budget")}>Set a monthly budget</a>}
            />
          )}
        </>
      )}

      <SectionTitle>{TREND_TITLES[granularity]}</SectionTitle>
      <TrendChart points={points} average={summary.dailyAverage && granularity === "day" ? summary.dailyAverage : 0} label={TREND_TITLES[granularity]} emptyText="Nothing spent in this period." />

      {singleCycle && (
        <>
          <SectionTitle>Every day of the month</SectionTitle>
          <HeatMap points={days} />
        </>
      )}

      <SectionTitle right={<span className={styles.sectionTotal}>{formatMoney(summary.total)}</span>}>By category</SectionTitle>
      {categoryBars.length ? <BarList items={categoryBars} /> : <p className={styles.note}>Nothing spent in this period.</p>}

      {top.length > 0 && (
        <>
          <SectionTitle>Biggest expenses</SectionTitle>
          <ListGroup>
            {top.map((expense) => (
              <ListRow
                key={expense.id}
                title={categoryNames.get(expense.categoryId) ?? UNCATEGORISED_NAME}
                subtitle={`${formatDate(expense.date)}${expense.note ? ` · ${expense.note}` : ""}`}
                right={<span className={styles.rowAmount}>{formatMoney(expense.amount)}</span>}
              />
            ))}
          </ListGroup>
        </>
      )}

      {granularity === "day" && busiest.length > 0 && (
        <>
          <SectionTitle>Busiest days</SectionTitle>
          <ListGroup>
            {busiest.map((day) => (
              <ListRow
                key={day.date}
                title={formatDate(day.date, { weekday: "short", day: "numeric", month: "short" })}
                subtitle={plural(day.count, "expense")}
                right={<span className={styles.rowAmount}>{formatMoney(day.amount)}</span>}
              />
            ))}
          </ListGroup>
        </>
      )}

      <SectionTitle>Last 12 months</SectionTitle>
      <TrendChart points={months} label="Last 12 months" emptyText="Not enough history yet." />

      {historyYears > 1 && (
        <>
          <SectionTitle>Year on year</SectionTitle>
          <TrendChart points={years} label="Year on year" emptyText="Not enough history yet." />
        </>
      )}
    </>
  );
}
