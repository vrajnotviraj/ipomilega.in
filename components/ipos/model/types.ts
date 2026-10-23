import type { HomePageIpoProps } from "@/types/ipo-with-analysis";
import type { Board } from "@/lib/ipo-format";
import type { Step } from "@/components/ipo-shared/lifecycle";

export type Status = "Upcoming" | "Open" | "Closed" | "Listed";

/** An IPO with its status and lifecycle steps. Built on the server, so "today" matches between server and browser. */
export type Row = HomePageIpoProps & { status: Status; steps: Step[] };

export type SortBy = "stage" | "opening" | "closing" | "listing" | "name" | "size" | "subscribed" | "gmp" | "score" | "listingGain" | "heldGain";
export type Sort = { by: SortBy; dir: "asc" | "desc" };

export type QuickKey = "gmpUp" | "oversubscribed" | "strongScore" | "allotmentDue" | "listsThisWeek" | "heldUp" | "heldDown" | "held25" | "held50" | "listing25";

export type BoardCounts = Record<Filters["board"], number>;

export type Filters = { status: Status | "all"; board: Board | "all"; query: string; sort: Sort; quick: QuickKey | null };
