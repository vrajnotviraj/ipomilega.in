// The welcome mail sent after a signup. Kept free of runtime imports: it takes formatted IPO rows and returns strings.
// Mail clients ignore stylesheets and flexbox, so this is table layout with inline styles, using the C1 tokens from
// design-system/tokens.css written out as hex. Light only, like the site: the color-scheme meta stops clients inverting it.

/** One IPO row in the mail, already formatted. */
export interface EmailIpo {
  name: string;
  url: string;
  board: string;
  priceBand: string;
  /** Expected listing gain in percent, from the GMP. */
  gmp: number | null;
  /** Total subscription, in times. */
  subscribed: number | null;
  /** "Closes today", "Closes 8 Oct", "Opens 9 Oct". */
  dateLabel: string;
  closingToday: boolean;
  /** The QIB-adjusted score shown on the site's cards, or null before the analysis is out. */
  score: number | null;
}

export interface WelcomeEmailData {
  name: string | null;
  siteUrl: string;
  unsubscribeUrl: string;
  live: EmailIpo[];
  upcoming: EmailIpo[];
}

const C = {
  ink: '#0F3B2E',
  marigold: '#F0A92E',
  chalk: '#FAFAF6',
  white: '#FFFFFF',
  surface: '#EEF1EA',
  muted: '#5E6B63',
  border: '#DCE2D8',
  good: '#1C7A4E',
  mid: '#94620C',
  bad: '#B8452F',
  chalkOnInk: '#C9D3CC',
};

const FONT = {
  display: "'Schibsted Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  body: "Figtree, 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'DM Mono', SFMono-Regular, Menlo, Consolas, monospace",
};

const MAX_ROWS = 3;

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);

/** `hex` mixed into white at `amount`, as the site's 11% score-pill tint. Written out because Outlook drops rgba(). */
function tint(hex: string, amount: number): string {
  const channel = (i: number) => {
    const value = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
    return Math.round(255 - (255 - value) * amount).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

const scoreColor = (score: number) => (score > 6 ? C.good : score > 3 ? C.mid : C.bad);
const gainColor = (value: number | null) => (!value ? C.muted : value > 0 ? C.good : C.bad);
const signed = (value: number) => `${value > 0 ? '+' : ''}${value}%`;
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** The first line of the mail, and the inbox preview text after the subject. */
function headline(data: WelcomeEmailData) {
  const greeting = data.name ? `You're in, ${data.name.split(/\s+/)[0]}.` : "You're in.";
  if (data.live.length) return { greeting, subject: `You're in. ${plural(data.live.length, 'IPO')} open for bidding now` };
  if (data.upcoming.length) return { greeting, subject: `You're in. ${plural(data.upcoming.length, 'IPO')} opening soon` };
  return { greeting, subject: "You're in. IPO alerts from IPO Milega" };
}

const WHAT_YOU_GET: [string, string][] = [
  ['Opens today', 'GMP, price band and our score, before you bid.'],
  ['Last day to bid', 'Subscription so far and your allotment odds.'],
  ['Listing today', 'The expected listing price from the latest GMP.'],
  ['New IPO dates', 'When a new issue gets its bidding dates.'],
];

function stat(label: string, value: string, color: string, align: 'left' | 'center' | 'right') {
  return `<td valign="top" align="${align}" style="padding:14px 0 0;width:33%;">
    <div style="font-family:${FONT.body};font-size:12px;line-height:16px;color:${C.muted};">${label}</div>
    <div style="font-family:${FONT.mono};font-size:15px;line-height:20px;font-weight:500;color:${color};padding-top:4px;white-space:nowrap;">${escapeHtml(value)}</div>
  </td>`;
}

function scorePill(score: number | null) {
  if (!score) return `<span style="font-family:${FONT.mono};font-size:14px;color:${C.muted};">&ndash;</span>`;
  const color = scoreColor(score);
  return `<span style="display:inline-block;background:${tint(color, 0.11)};color:${color};border-radius:999px;padding:3px 10px;font-family:${FONT.mono};font-size:14px;line-height:18px;font-weight:500;white-space:nowrap;">${score.toFixed(1)}<span style="font-size:11px;">/10</span></span>`;
}

function ipoCard(ipo: EmailIpo, stage: 'live' | 'upcoming') {
  const stats =
    stage === 'live'
      ? [
          stat('GMP', ipo.gmp === null ? 'N/A' : signed(ipo.gmp), gainColor(ipo.gmp), 'left'),
          stat('Subscribed', ipo.subscribed === null ? '–' : `${ipo.subscribed}x`, C.ink, 'center'),
          stat('Closes', ipo.dateLabel.replace(/^Closes /, ''), ipo.closingToday ? C.bad : C.ink, 'right'),
        ]
      : [
          stat('Price band', ipo.priceBand, C.ink, 'left'),
          stat('GMP', ipo.gmp === null ? 'N/A' : signed(ipo.gmp), gainColor(ipo.gmp), 'center'),
          stat('Opens', ipo.dateLabel.replace(/^Opens /, ''), C.ink, 'right'),
        ];

  return `<tr><td style="padding:0 0 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.white};border:1px solid ${C.border};border-radius:12px;">
    <tr><td style="padding:18px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle">
            <a href="${ipo.url}" style="font-family:${FONT.display};font-size:18px;line-height:23px;font-weight:700;letter-spacing:-0.015em;color:${C.ink};text-decoration:none;">${escapeHtml(ipo.name)}</a>
            <div style="padding-top:6px;"><span style="display:inline-block;border:1px solid ${C.border};border-radius:999px;padding:1px 8px;font-family:${FONT.body};font-size:11px;line-height:16px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:${C.muted};">${escapeHtml(ipo.board)}</span></div>
          </td>
          <td valign="middle" align="right" style="padding-left:12px;">${scorePill(ipo.score)}</td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.border};margin-top:14px;">
        <tr>${stats.join('')}</tr>
      </table>
    </td></tr>
  </table>
</td></tr>`;
}

function ipoSection(title: string, ipos: EmailIpo[], stage: 'live' | 'upcoming') {
  if (!ipos.length) return '';
  return `<tr><td style="padding:36px 0 14px;">
  <h2 style="margin:0;font-family:${FONT.display};font-size:24px;line-height:28px;font-weight:700;letter-spacing:-0.03em;color:${C.ink};">${title}</h2>
</td></tr>
${ipos.slice(0, MAX_ROWS).map((ipo) => ipoCard(ipo, stage)).join('\n')}`;
}

// The candle mark from design-system/logo/mark.svg at 32px (the 64-unit grid halved), in table cells rather than an
// image: Gmail drops SVG, and a hosted PNG would show as a broken image until it reaches production.
// [space above the wick, wick above the body, body, wick below], in px.
const CANDLES: [number, number, number, number][] = [
  [5, 3, 16, 3],
  [13, 2, 7, 3],
  [3, 3, 18, 3],
];

function logoMark() {
  const bar = (height: number, width: string, color: string, radius = 0) =>
    `<div style="height:${height}px;width:${width};margin:0 auto;background:${color};border-radius:${radius}px;font-size:0;line-height:0;">&nbsp;</div>`;
  const cells = CANDLES.map(([gap, top, body, bottom], i) => {
    const color = i === 2 ? C.marigold : C.ink;
    return `<td valign="top" width="6" style="width:6px;padding:${gap}px ${i < 2 ? 3 : 0}px 0 0;">${bar(top, '1.5px', C.ink, 1)}${bar(body, '6px', color, 1.5)}${bar(bottom, '1.5px', C.ink, 1)}</td>`;
  });
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="height:32px;padding:0 2px;" aria-label="IPO Milega"><tr>${cells.join('')}</tr></table>`;
}

/** Primary CTA: ink pill with the arrow in a marigold circle, as ArrowLink on the site. */
function ctaButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 0;">
  <tr><td style="background:${C.ink};border-radius:999px;padding:6px 6px 6px 22px;">
    <a href="${href}" style="font-family:${FONT.body};font-size:15px;line-height:20px;font-weight:500;color:${C.chalk};text-decoration:none;white-space:nowrap;">${label}&nbsp;&nbsp;<span style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:999px;background:${C.marigold};color:${C.ink};text-align:center;font-size:16px;vertical-align:middle;">&#8599;</span></a>
  </td></tr>
</table>`;
}

/** Subject, HTML and plain-text bodies of the welcome mail. */
export function renderWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string; text: string } {
  const { greeting, subject } = headline(data);
  const preheader = 'One short email on days an IPO opens, closes or lists, before bidding starts.';
  const live = data.live.slice(0, MAX_ROWS);
  // Upcoming issues fill in only when nothing is open, so the mail stays short.
  const upcoming = live.length ? [] : data.upcoming.slice(0, MAX_ROWS);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600&family=Schibsted+Grotesk:wght@500;700;900&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light only; }
  body { margin:0; padding:0; background:${C.chalk}; -webkit-text-size-adjust:100%; }
  a { color:${C.ink}; }
  @media (max-width: 480px) {
    .px { padding-left:20px !important; padding-right:20px !important; }
    .hero-title { font-size:30px !important; line-height:31px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.chalk};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.chalk};">${preheader}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.chalk};">
<tr><td align="center" style="padding:32px 12px 40px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

  <tr><td style="padding:0 4px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="middle">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle">${logoMark()}</td>
          <td valign="middle" style="padding-left:8px;"><a href="${data.siteUrl}" style="font-family:${FONT.display};font-size:21px;line-height:24px;letter-spacing:-0.045em;color:${C.ink};text-decoration:none;"><span style="font-weight:900;">IPO</span> <span style="font-weight:500;">Milega</span></a></td>
        </tr></table>
      </td>
      <td valign="middle" align="right" style="font-family:${FONT.body};font-size:13px;color:${C.muted};">Milega? Check first.</td>
    </tr></table>
  </td></tr>

  <tr><td class="px" style="background:${C.ink};border-radius:18px;padding:36px 36px 34px;">
    <div style="font-family:${FONT.body};font-size:12px;line-height:16px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${C.marigold};">IPO alerts are on</div>
    <h1 class="hero-title" style="margin:12px 0 0;font-family:${FONT.display};font-size:38px;line-height:38px;font-weight:900;letter-spacing:-0.035em;color:${C.chalk};">${escapeHtml(greeting)}</h1>
    <p style="margin:16px 0 0;font-family:${FONT.body};font-size:16px;line-height:25px;color:${C.chalkOnInk};">From the next IPO day, you'll get <span style="color:${C.chalk};text-decoration:underline;text-decoration-color:${C.marigold};text-decoration-thickness:2px;text-underline-offset:3px;">one short email</span> when an issue opens, closes or lists. It lands before bidding starts, with the numbers you need to decide.</p>
  </td></tr>

  <tr><td style="padding:12px 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.white};border:1px solid ${C.border};border-radius:12px;">
      <tr><td class="px" style="padding:22px 24px 8px;">
        <div style="font-family:${FONT.body};font-size:12px;line-height:16px;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:${C.muted};">What lands in your inbox</div>
      </td></tr>
      ${WHAT_YOU_GET.map(([title, body], i) => `<tr><td class="px" style="padding:0 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${i ? `border-top:1px solid ${C.border};` : ''}"><tr>
          <td valign="top" style="width:36px;padding:14px 0;font-family:${FONT.mono};font-size:13px;line-height:22px;color:${C.muted};">0${i + 1}</td>
          <td valign="top" style="padding:14px 0;">
            <div style="font-family:${FONT.display};font-size:16px;line-height:22px;font-weight:700;letter-spacing:-0.015em;color:${C.ink};">${title}</div>
            <div style="font-family:${FONT.body};font-size:14px;line-height:21px;color:${C.muted};padding-top:2px;">${body}</div>
          </td>
        </tr></table>
      </td></tr>`).join('\n')}
      <tr><td style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>
    </table>
  </td></tr>

  ${ipoSection('Open for bidding now', live, 'live')}
  ${ipoSection('Opening soon', upcoming, 'upcoming')}

  <tr><td align="center" style="padding:28px 0 0;">${ctaButton(`${data.siteUrl}/ipos`, 'See every IPO')}</td></tr>

  <tr><td style="padding:40px 8px 0;border-top:0;">
    <p style="margin:0;font-family:${FONT.body};font-size:13px;line-height:20px;color:${C.muted};text-align:center;">You're getting this because you signed up for IPO alerts on <a href="${data.siteUrl}" style="color:${C.muted};">ipomilega.in</a>. <a href="${data.unsubscribeUrl}" style="color:${C.ink};font-weight:500;">Unsubscribe</a></p>
    <p style="margin:10px 0 0;font-family:${FONT.body};font-size:12px;line-height:18px;color:${C.muted};text-align:center;">GMP is unofficial and moves fast. This is data and analysis, not investment advice. Read the RHP before you bid.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  const textRows = (ipos: EmailIpo[], stage: 'live' | 'upcoming') =>
    ipos.map((ipo) =>
      [
        `- ${ipo.name} (${ipo.board})`,
        stage === 'live'
          ? `  GMP ${ipo.gmp === null ? 'N/A' : signed(ipo.gmp)} · Subscribed ${ipo.subscribed === null ? '–' : `${ipo.subscribed}x`} · ${ipo.dateLabel}`
          : `  ${ipo.priceBand} · GMP ${ipo.gmp === null ? 'N/A' : signed(ipo.gmp)} · ${ipo.dateLabel}`,
        `  ${ipo.url}`,
      ].join('\n')
    );

  const text = [
    greeting,
    "From the next IPO day, you'll get one short email when an issue opens, closes or lists. It lands before bidding starts.",
    'What lands in your inbox:\n' + WHAT_YOU_GET.map(([title, body]) => `- ${title}: ${body}`).join('\n'),
    live.length ? 'Open for bidding now:\n' + textRows(live, 'live').join('\n') : '',
    upcoming.length ? 'Opening soon:\n' + textRows(upcoming, 'upcoming').join('\n') : '',
    `See every IPO: ${data.siteUrl}/ipos`,
    `Unsubscribe: ${data.unsubscribeUrl}`,
    'GMP is unofficial and moves fast. This is data and analysis, not investment advice.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return { subject, html, text };
}
