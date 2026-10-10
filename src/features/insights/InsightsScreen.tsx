/* Where the money went — the same sums seen from a month, a year or a decade away. */
import { useMemo } from "react";
import { FiPieChart, FiTarget } from "react-icons/fi";
import { href, type Route } from "../../app/router";
import { colorVars } from "../../data/categoryColors";
import { heatBarColor } from "../../data/heatLevel";
import {
  biggestExpenses, budgetStatus, busiestDays, byCategory, byDay, byMethod, byWeekday,
  cumulativeSeries, granularityFor, inRange, meanOfUsed, monthSeries, safeToSpend, summarise,
  totalOf, trend, trimLeadingEmpty, UNCATEGORISED_FILTER, UNCATEGORISED_NAME, withPrevious,
  yearSeries, yearsOfHistory,
} from "../../data/insights";
import { cycleContaining, cycleLabel, daysBetween, shiftCycle } from "../../data/months";
import { isSingleCycle, PERIOD_PRESETS, PREVIOUS_LABELS, previousRange } from "../../data/periods";
import { settingsOf } from "../../data/settings";
import { carriedInto, committedAhead, costsIn, dayCostsIn } from "../../data/spread";
import { useDB } from "../../data/store";
import { formatDate, todayISO } from "../../lib/dates";
import { formatMoney, formatShare, plural, round2 } from "../../lib/format";
import { BarList, type BarItem } from "../../ui/BarList";
import { EmptyState } from "../../ui/feedback";
import { PageHeader, SectionTitle } from "../../ui/layout";
import { PeriodChips } from "../period/PeriodChips";
import { usePeriodFilter } from "../period/usePeriodFilter";
import { BudgetCard } from "./BudgetCard";
import { DonutChart } from "./DonutChart";
import { HeatMap } from "./HeatMap";
import { PaceChart } from "./PaceChart";
import { MethodSplit, WeekdayChart } from "./PatternCharts";
import { PeriodSummaryCard } from "./PeriodSummaryCard";
import { SafeToSpend } from "./SafeToSpend";
import { TrendChart } from "./TrendChart";
import styles from "./insights.module.css";

const TOP_LIST_LIMIT = 5;
const COMPARISON_MONTHS = 12;
/** Below this the chart stops being a chart, so a short history keeps a few blank bars. */
const MIN_COMPARISON_BARS = 4;
const MAX_COMPARISON_YEARS = 10;

const TREND_TITLES = { day: "Day by day", month: "Month by month", year: "Year by year" } as const;

export function InsightsScreen({ route }: { route: Route }) {
  const db = useDB();
  const today = todayISO();
  const settings = settingsOf(db);
  const { monthStartDay, monthlyBudget } = settings;
  const period = usePeriodFilter(route, monthStartDay, PERIOD_PRESETS);

  /* Everything that totals, groups or compares runs on what the period *costs*: a payment
   * that covers six months is charged a sixth here and the rest to the months it bought.
   * The biggest-payments list below is the one view that stays on the payments themselves. */
  const expenses = useMemo(() => costsIn(db.expenses, period.range, monthStartDay), [db.expenses, period.range, monthStartDay]);
  const paid = useMemo(() => inRange(db.expenses, period.range), [db.expenses, period.range]);
  const summary = useMemo(() => summarise(expenses, period.range, today), [expenses, period.range, today]);
  const slices = useMemo(() => byCategory(expenses, db.categories), [expenses, db.categories]);
  const granularity = useMemo(() => granularityFor(expenses, period.range), [expenses, period.range]);
  /* Day-level views drop the cost carried in from earlier payments, because it belongs to
   * no day — the calendar and the day chart would otherwise mark a day nothing happened
   * on. The carried figure is named under the total instead, and opens the pace chart. */
  const days = useMemo(() => byDay(dayCostsIn(paid, period.range), period.range), [paid, period.range]);
  const points = useMemo(
    () => trend(granularity === "day" ? dayCostsIn(paid, period.range) : expenses, period.range, granularity, monthStartDay),
    [paid, expenses, period.range, granularity, monthStartDay],
  );

  const before = useMemo(() => {
    const range = previousRange(period.range, period.preset, today, monthStartDay);
    return range ? costsIn(db.expenses, range, monthStartDay) : null;
  }, [db.expenses, period.range, period.preset, today, monthStartDay]);
  const previous = before ? totalOf(before) : null;
  /* With nothing behind this period, "+₹3,349" on every row would just repeat the amount. */
  const comparable = Boolean(before?.length);
  const movements = useMemo(
    () => withPrevious(slices, before ? byCategory(before, db.categories) : []),
    [slices, before, db.categories],
  );

  const lastMonthPerDay = useMemo(() => {
    const previousCycle = shiftCycle(cycleContaining(today, monthStartDay), monthStartDay, -1);
    const spent = totalOf(costsIn(db.expenses, previousCycle, monthStartDay));
    return spent ? round2(spent / daysBetween(previousCycle.from, previousCycle.to)) : 0;
  }, [db.expenses, today, monthStartDay]);

  const months = useMemo(
    () => trimLeadingEmpty(monthSeries(db.expenses, today, monthStartDay, COMPARISON_MONTHS), MIN_COMPARISON_BARS),
    [db.expenses, today, monthStartDay],
  );
  const historyYears = useMemo(() => yearsOfHistory(db.expenses, today, monthStartDay), [db.expenses, today, monthStartDay]);
  const years = useMemo(
    () => yearSeries(db.expenses, today, monthStartDay, Math.min(MAX_COMPARISON_YEARS, historyYears)),
    [db.expenses, today, monthStartDay, historyYears],
  );

  const carried = carriedInto(db.expenses, period.range, monthStartDay);
  const ahead = committedAhead(db.expenses, period.range, monthStartDay);
  const spreadNotes = [
    carried > 0 && `includes ${formatMoney(carried)} from payments made earlier`,
    ahead > 0 && `${formatMoney(ahead)} paid here covers later months`,
  ].filter(Boolean);

  const singleCycle = isSingleCycle(period.range, monthStartDay);
  /* A whole month gets its name; anything else is described by its two ends. */
  const summaryLabel = singleCycle ? cycleLabel(cycleContaining(period.range.from, monthStartDay), monthStartDay) : period.rangeLabel;
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
  const facts = [
    { label: "A day", value: formatMoney(summary.dailyAverage) },
    running && summary.daysLeft > 0
      ? { label: "On track for", value: formatMoney(summary.projected) }
      : { label: "Busiest day", value: formatMoney(peakDay?.amount ?? 0) },
    running && summary.daysLeft > 0
      ? { label: "Days left", value: String(summary.daysLeft) }
      : { label: "Over", value: plural(summary.daysTotal, "day") },
  ];

  const categoryBars: BarItem[] = movements.map((slice) => ({
    key: slice.categoryId || UNCATEGORISED_FILTER,
    label: slice.name,
    value: slice.amount,
    color: colorVars(slice.color).ink,
    display: (
      <>
        {formatMoney(slice.amount)} · {formatShare(slice.share)}
        {comparable && slice.change !== 0 && (
          <small className={slice.change > 0 ? styles.movementUp : styles.movementDown}>
            {slice.change > 0 ? "+" : "−"}{formatMoney(Math.abs(slice.change))}
          </small>
        )}
      </>
    ),
    href: href("history", {
      category: slice.categoryId || UNCATEGORISED_FILTER,
      period: period.preset,
      from: period.preset === "custom" ? period.range.from : null,
      to: period.preset === "custom" ? period.range.to : null,
    }),
  }));

  const categoryNames = new Map(db.categories.map((c) => [c.id, c.name]));
  const categoryColours = new Map(db.categories.map((c) => [c.id, c.color]));
  const top = biggestExpenses(paid, TOP_LIST_LIMIT);

  /** Both top-fives link to the day they happened on, which is where the detail is. */
  const dayHref = (date: string) => href("history", { period: "custom", from: date, to: date });

  const biggestBars: BarItem[] = top.map((expense) => ({
    key: expense.id,
    label: expense.note.trim() || categoryNames.get(expense.categoryId) || UNCATEGORISED_NAME,
    value: expense.amount,
    color: colorVars(categoryColours.get(expense.categoryId) ?? "slate").ink,
    display: `${formatMoney(expense.amount)} · ${formatDate(expense.date, { day: "numeric", month: "short" })}`,
    href: dayHref(expense.date),
  }));

  const busiestPeak = Math.max(1, ...busiest.map((d) => d.amount));
  const busiestBars: BarItem[] = busiest.map((day) => ({
    key: day.date,
    label: formatDate(day.date, { weekday: "short", day: "numeric", month: "short" }),
    value: day.amount,
    // The calendar's own scale, so the heaviest days look heavy here too.
    color: heatBarColor(day.amount, busiestPeak),
    display: `${formatMoney(day.amount)} · ${plural(day.count, "expense")}`,
    href: dayHref(day.date),
  }));
  const budget = monthlyBudget > 0 ? budgetStatus(summary.total, monthlyBudget, summary.daysTotal, summary.daysElapsed) : null;
  const allowances = budget ? safeToSpend(slices, db.categories, budget.left, summary.daysLeft) : [];
  /* Only up to today: a flat line across the days still to come would read as "I stopped
   * spending", and the even pace has to be compared at the same point. */
  const pace = cumulativeSeries(days.filter((d) => d.date <= today), carried);
  const weekdays = byWeekday(days);
  const methods = byMethod(expenses);
  /* One filled bar beside three empty ones is not a comparison; the note says so instead. */
  const monthsWithData = months.filter((m) => m.amount > 0).length;

  return (
    <>
      <PageHeader title="Insights" />
      <PeriodChips filter={period} presets={PERIOD_PRESETS} />

      <PeriodSummaryCard
        label={summaryLabel}
        summary={summary}
        previous={previous}
        previousLabel={PREVIOUS_LABELS[period.preset] ?? "the period before"}
        note={spreadNotes.length ? `Spread over months: ${spreadNotes.join(" · ")}.` : undefined}
        facts={facts}
      />

      {singleCycle && (
        <>
          <SectionTitle>Budget</SectionTitle>
          {budget ? (
            <BudgetCard status={budget} daysLeft={summary.daysLeft} lastMonthPerDay={lastMonthPerDay} />
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

      {singleCycle && pace.length > 1 && (
        <>
          <SectionTitle>Running total</SectionTitle>
          <PaceChart points={pace} budget={monthlyBudget} daysTotal={summary.daysTotal} />
        </>
      )}

      {singleCycle && (
        <>
          <SectionTitle>Every day of the month</SectionTitle>
          <HeatMap points={days} />
        </>
      )}

      {expenses.length > 0 && (
        <>
          <SectionTitle>Which day of the week</SectionTitle>
          <WeekdayChart points={weekdays} />

          <SectionTitle>How it was paid</SectionTitle>
          <MethodSplit slices={methods} />
        </>
      )}

      <SectionTitle right={<span className={styles.sectionTotal}>{formatMoney(summary.total)}</span>}>By category</SectionTitle>
      {categoryBars.length ? (
        <>
          <DonutChart slices={slices} total={summary.total} caption={summaryLabel} />
          <BarList items={categoryBars} />
        </>
      ) : (
        <p className={styles.note}>Nothing spent in this period.</p>
      )}

      {budget && summary.daysLeft > 0 && allowances.length > 0 && (
        <>
          <SectionTitle right={<span className={styles.sectionTotal}>{formatMoney(budget.perDayLeft)} a day</span>}>
            Safe to spend from here
          </SectionTitle>
          <SafeToSpend allowances={allowances} daysLeft={summary.daysLeft} anyOwnBudget={allowances.some((a) => a.ownBudget)} />
        </>
      )}

      {top.length > 0 && (
        <>
          <SectionTitle>Biggest expenses</SectionTitle>
          <BarList items={biggestBars} />
        </>
      )}

      {granularity === "day" && busiest.length > 0 && (
        <>
          <SectionTitle>Busiest days</SectionTitle>
          <BarList items={busiestBars} />
        </>
      )}

      {monthsWithData > 1 ? (
        <>
          <SectionTitle right={<span className={styles.sectionTotal}>{formatMoney(meanOfUsed(months))} a month</span>}>
            {months.length === COMPARISON_MONTHS ? "Last 12 months" : "Month by month"}
          </SectionTitle>
          <TrendChart points={months} average={meanOfUsed(months)} label="Month by month" emptyText="Not enough history yet." />
        </>
      ) : (
        <>
          <SectionTitle>Month by month</SectionTitle>
          <p className={styles.note}>This is your first month — the comparison fills in from next month.</p>
        </>
      )}

      {historyYears > 1 && (
        <>
          <SectionTitle>Year on year</SectionTitle>
          <TrendChart points={years} average={meanOfUsed(years)} label="Year on year" emptyText="Not enough history yet." />
        </>
      )}
    </>
  );
}
