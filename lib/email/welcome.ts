import 'server-only';
import { getIpoBuckets } from '@/lib/queries/ipos';
import { daysFromToday, formatShortDateOrToday, getIpoType, getPriceBand, parseEstListingPercent, parseGainValue } from '@/lib/ipo-format';
import { adjustedScoreOf } from '@/lib/ipo-score';
import { SITE_URL } from '@/lib/seo/share';
import { sendMail } from '@/lib/email/mailer';
import { EmailIpo, renderWelcomeEmail } from '@/lib/email/welcome-email';
import type { HomePageIpoProps } from '@/types/ipo-with-analysis';
import type { Welcome } from '@/lib/subscribers/store';

/** One card from the home page buckets as a formatted mail row. Links go to the analysis when there is one, as on the cards. */
function toEmailIpo({ ipo, analysis }: HomePageIpoProps, stage: 'live' | 'upcoming'): EmailIpo {
  const score = adjustedScoreOf({ ipo, analysis }) || null;
  const close = ipo?.ipo_dates?.ipo_close_date || ipo?.closing_date;
  const open = ipo?.ipo_dates?.ipo_open_date || ipo?.open_date;
  const band = getPriceBand(ipo);
  return {
    name: ipo?.upcoming_ipo_2025 || ipo?.ipo_name || 'IPO',
    url: score && ipo?.slug ? `${SITE_URL}/analysis/${ipo.slug}` : `${SITE_URL}/ipos`,
    board: getIpoType(ipo),
    priceBand: band ? `₹${band}` : 'Price TBA',
    gmp: parseEstListingPercent(ipo?.gmp_price_gain),
    subscribed: parseGainValue(ipo?.total_sr),
    dateLabel: stage === 'live' ? `Closes ${formatShortDateOrToday(close)}` : `Opens ${formatShortDateOrToday(open)}`,
    closingToday: stage === 'live' && daysFromToday(close) === 0,
    score,
  };
}

/** The IPOs open now and opening next, as mail rows. */
export async function emailIpoRows() {
  const { live, upcoming } = await getIpoBuckets();
  return {
    live: live.map((item) => toEmailIpo(item, 'live')),
    upcoming: upcoming.map((item) => toEmailIpo(item, 'upcoming')),
  };
}

export const unsubscribeUrl = (token: string) => `${SITE_URL}/unsubscribe?t=${encodeURIComponent(token)}&c=email`;

/**
 * Sends the welcome mail with what is open right now. Carries the one-click unsubscribe headers Gmail and Yahoo
 * require from bulk senders, pointing at the API route that takes the mail client's POST.
 */
export async function sendWelcomeEmail(welcome: Welcome): Promise<boolean> {
  const rows = await emailIpoRows().catch((error) => {
    // The mail still goes out without the IPO list if the read fails.
    console.error('Welcome mail: IPO read failed:', error);
    return { live: [], upcoming: [] };
  });
  const mail = renderWelcomeEmail({
    name: welcome.name,
    siteUrl: SITE_URL,
    unsubscribeUrl: unsubscribeUrl(welcome.unsubscribeToken),
    ...rows,
  });
  return sendMail({
    to: welcome.email,
    ...mail,
    headers: {
      'List-Unsubscribe': `<${SITE_URL}/api/unsubscribe?t=${encodeURIComponent(welcome.unsubscribeToken)}&c=email>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
}
