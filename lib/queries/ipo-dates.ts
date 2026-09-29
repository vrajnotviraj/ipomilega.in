/** Parses loose scraper date strings like "12 June", "June 12, 2025", "TBA". */
export function parseIpoDate(
  dateString: string | undefined,
  currentYear: number = new Date().getFullYear()
): Date | null {
  if (!dateString) return null;

  const cleanDate = dateString.trim();

  if (cleanDate.toLowerCase() === 'tba' || cleanDate === '-' || cleanDate === '') return null;

  // A bare year ("2025") or month and year ("January 2025") is not a real date.
  if (/^\d{4}$/.test(cleanDate)) return null;
  if (/^(?:\d{4}\s+[a-zA-Z]+|[a-zA-Z]+\s+\d{4})$/.test(cleanDate)) return null;

  const hasFullYear = cleanDate.includes(',') && /\d{4}/.test(cleanDate);
  if (hasFullYear) {
    const parsedDate = new Date(cleanDate);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  // Without a day of month, "June" alone would silently become the 1st.
  if (!/\b([1-9]|[12]\d|3[01])\b/.test(cleanDate)) return null;

  const parsedDate = new Date(`${cleanDate} ${currentYear}`);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

type IpoDateFields = {
  ipo_dates?: { ipo_open_date?: string; ipo_close_date?: string; ipo_listing_date?: string };
  open_date?: string;
  closing_date?: string;
};

export function getOpenDateString(ipo: IpoDateFields): string {
  return ipo.ipo_dates?.ipo_open_date || ipo.open_date || '';
}

export function getCloseDateString(ipo: IpoDateFields): string {
  return ipo.ipo_dates?.ipo_close_date || ipo.closing_date || '';
}

export function getListingDateString(ipo: IpoDateFields): string {
  return ipo.ipo_dates?.ipo_listing_date || '';
}
