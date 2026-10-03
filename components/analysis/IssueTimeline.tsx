"use client";
import { useEffect, useState } from "react";
import { dayNumberInIndia, daysFromToday, formatShortDate, parseIpoDate } from "@/lib/ipo-format";
import { cn } from "@/lib/utils";

type Align = "left" | "center" | "right";

const MIN_LABEL_GAP = 20;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Pushes neighbouring positions at least MIN_LABEL_GAP apart, keeping the first at 0 and the last at 100. */
function spreadApart(positions: number[]): number[] {
  const spread = [...positions];
  for (let i = 1; i < spread.length; i++) spread[i] = Math.max(spread[i], spread[i - 1] + MIN_LABEL_GAP);
  spread[spread.length - 1] = 100;
  for (let i = spread.length - 2; i >= 0; i--) spread[i] = Math.min(spread[i], spread[i + 1] - MIN_LABEL_GAP);
  return spread;
}

/** Maps a date-proportional position onto the spread-out rail, piece by piece between stations. */
function toRailPosition(raw: number, truePositions: number[], railPositions: number[]): number {
  for (let i = 1; i < truePositions.length; i++) {
    if (raw > truePositions[i]) continue;
    const span = truePositions[i] - truePositions[i - 1];
    const t = span === 0 ? 1 : (raw - truePositions[i - 1]) / span;
    return railPositions[i - 1] + t * (railPositions[i] - railPositions[i - 1]);
  }
  return railPositions[railPositions.length - 1];
}

const ALIGN_OFFSET: Record<Align, string> = { left: "", center: "-translate-x-1/2", right: "-translate-x-full" };

/** Where the filled part of the rail ends for a date-proportional position, or 0 before mount. */
function progressAt(todayRaw: number | null, truePositions: number[], railPositions: number[]): number {
  if (todayRaw === null || todayRaw < 0) return 0;
  if (todayRaw > 100) return 100;
  return toRailPosition(todayRaw, truePositions, railPositions);
}

/** "Closes in 3 days", "Lists tomorrow": the next issue date from today, or null once listed. */
function countdownLabel(steps: { verb: string; date: string }[]): string | null {
  for (const { verb, date } of steps) {
    const days = daysFromToday(date);
    if (days === null || days < 0) continue;
    if (days === 0) return `${verb} today`;
    if (days === 1) return `${verb} tomorrow`;
    return `${verb} in ${days} days`;
  }
  return null;
}

/** Raises each position to at least the one before it, so stations stay in date order. */
function keepInDateOrder(positions: number[]): number[] {
  const ordered = [...positions];
  for (let i = 1; i < ordered.length; i++) ordered[i] = Math.max(ordered[i], ordered[i - 1]);
  return ordered;
}

/** Date-proportional station positions, the same spread apart for labels, and the date-to-percent map. */
function railLayout(closing: string, allotment: string, openDate: Date, listDate: Date) {
  const openDay = dayNumberInIndia(openDate);
  const totalDays = dayNumberInIndia(listDate) - openDay;
  const percentThrough = (date: Date) => ((dayNumberInIndia(date) - openDay) / totalDays) * 100;
  const positionOf = (value: string) => {
    const date = parseIpoDate(value);
    return date ? clamp(percentThrough(date), 0, 100) : 0;
  };
  const truePositions = keepInDateOrder([0, positionOf(closing), positionOf(allotment), 100]);
  return { percentThrough, truePositions, railPositions: spreadApart(truePositions) };
}

type Station = { label: string; date: string; pos: number; align: Align };

/** Open, close, allotment and listing on a rail spaced by date, with a marker for today. */
export function IssueTimeline({ opening, closing, allotment, listing }: Record<"opening" | "closing" | "allotment" | "listing", string>) {
  // Read after mount: the page is ISR-cached, so a server-side date would be stale and break hydration.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const openDate = parseIpoDate(opening);
  const listDate = parseIpoDate(listing);
  if (!openDate || !listDate || dayNumberInIndia(listDate) <= dayNumberInIndia(openDate)) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Timeline will be available once opening and listing dates are confirmed.</p>;
  }

  const { percentThrough, truePositions, railPositions } = railLayout(closing, allotment, openDate, listDate);
  const stations: Station[] = [
    { label: "Open", date: opening, pos: railPositions[0], align: "left" },
    { label: "Close", date: closing, pos: railPositions[1], align: "center" },
    { label: "Allotment", date: allotment, pos: railPositions[2], align: "center" },
    { label: "Listing", date: listing, pos: railPositions[3], align: "right" },
  ];

  const progress = progressAt(today ? percentThrough(today) : null, truePositions, railPositions);
  const todayLabel = today?.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) ?? "";
  const isReached = (value: string) => {
    const date = parseIpoDate(value);
    return !!date && !!today && dayNumberInIndia(date) <= dayNumberInIndia(today);
  };
  const isToday = (value: string) => {
    const date = parseIpoDate(value);
    return !!date && !!today && dayNumberInIndia(date) === dayNumberInIndia(today);
  };
  // On a station's own day that station is marked instead, and after listing the rail is simply done.
  const showTodayChip = !!today && !stations.some((station) => isToday(station.date)) && !isReached(listing);
  const countdown = today
    ? countdownLabel([
        { verb: "Opens", date: opening },
        { verb: "Closes", date: closing },
        { verb: "Lists", date: listing },
      ])
    : null;
  // Stations are in date order, so today sits after the last one reached. Before mount it waits at the end, hidden.
  const todayIndex = today ? stations.filter((station) => isReached(station.date)).length : stations.length;
  const todayRow = (
    <li key="today" className={cn("flex items-center gap-3", !showTodayChip && "hidden")}>
      <TodayChip label={todayLabel} />
      {countdown && <span className="font-mono text-xs tabular-nums text-muted-foreground">{countdown}</span>}
    </li>
  );
  const stationRow = (station: Station) => (
    <li key={station.label} className="flex items-center gap-3">
      <StationDot reached={isReached(station.date)} today={isToday(station.date)} />
      <span className="w-24 shrink-0 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{station.label}</span>
      <StationDate date={station.date} today={isToday(station.date)} />
    </li>
  );

  return (
    <>
      {/* Phones have no room for four labels on a rail, so they get a list. */}
      <ol className="space-y-4 sm:hidden">
        {stations.slice(0, todayIndex).map(stationRow)}
        {todayRow}
        {stations.slice(todayIndex).map(stationRow)}
      </ol>

      <DesktopRail stations={stations} progress={progress} showTodayChip={showTodayChip} todayLabel={todayLabel} isReached={isReached} isToday={isToday} />
    </>
  );
}

/** Places an element at its station on the rail, aligned to the station's side. */
const atStation = (station: Station, className: string) => ({
  className: cn(className, ALIGN_OFFSET[station.align]),
  style: { left: `${station.pos}%` },
});

/** The sm+ rail: labels above, dots and progress on the line, the today chip pointing at today, then dates. */
function DesktopRail({ stations, progress, showTodayChip, todayLabel, isReached, isToday }: {
  stations: Station[];
  progress: number;
  showTodayChip: boolean;
  todayLabel: string;
  isReached: (value: string) => boolean;
  isToday: (value: string) => boolean;
}) {
  return (
    <div className="hidden pt-2 sm:block">
      <div className="relative h-5">
        {stations.map((station) => (
          <span key={station.label} {...atStation(station, "absolute top-0 whitespace-nowrap text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground")}>
            {station.label}
          </span>
        ))}
      </div>

      <div className="relative my-1.5 h-4">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-border" />
        <div className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary" style={{ width: `${progress}%` }} />
        {stations.map((station) => (
          <StationDot key={station.label} reached={isReached(station.date)} today={isToday(station.date)} {...atStation(station, "absolute top-1/2 -translate-y-1/2")} />
        ))}
      </div>

      {/* Fixed height so nothing shifts when the today marker appears. */}
      <div className="relative h-8">
        {showTodayChip && (
          <div className="absolute top-1.5" style={{ left: `${progress}%` }}>
            <span className="absolute -top-1.5 -translate-x-1/2 border-x-[5px] border-b-[6px] border-x-transparent border-b-brand-accent" aria-hidden="true" />
            <div className={cn("absolute top-0 flex", chipOffset(progress))}>
              <TodayChip label={todayLabel} />
            </div>
          </div>
        )}
      </div>

      <div className="relative h-5">
        {stations.map((station) => (
          <span key={station.label} {...atStation(station, "absolute top-0")}>
            <StationDate date={station.date} today={isToday(station.date)} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** Centres the chip on its arrow, or keeps it inside the rail near either end. */
function chipOffset(progress: number) {
  if (progress < 8) return "-translate-x-3";
  if (progress > 92) return "-translate-x-[calc(100%-0.75rem)]";
  return "-translate-x-1/2";
}

/** A station's date; on the station's own day it becomes the marigold today chip. */
function StationDate({ date, today }: { date: string; today: boolean }) {
  const formatted = formatShortDate(date, true);
  if (!today) return <span className="whitespace-nowrap font-mono text-sm font-medium tabular-nums">{formatted}</span>;
  return (
    <span className="-mx-2 whitespace-nowrap rounded-full bg-brand-accent px-2 py-0.5 font-mono text-sm font-medium tabular-nums text-primary">
      <span className="sr-only">Today, </span>
      {formatted}
    </span>
  );
}

function StationDot({ reached, today = false, className, style }: { reached: boolean; today?: boolean; className?: string; style?: React.CSSProperties }) {
  const fill = today ? "border-brand-accent bg-brand-accent" : reached ? "border-primary bg-primary" : "border-muted-foreground/40 bg-card";
  return (
    <span
      className={cn("size-3 shrink-0 rounded-full border-2", fill, className)}
      style={style}
    />
  );
}

function TodayChip({ label }: { label: string }) {
  return (
    <span className="whitespace-nowrap rounded-full bg-brand-accent px-2.5 py-0.5 text-xs font-medium text-primary">
      Today <span className="font-mono tabular-nums">{label}</span>
    </span>
  );
}
