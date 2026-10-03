export interface Blog {
  _id: string
  title: string
  slug: string
  content: string
  excerpt: string
  tags: string[]
  category: string
  status: string
  meta_description: string
  image_url?: string
  author: string
  author_slug?: string | null
  ipo_id: string
  created_at: string
  published_at?: string
  updated_at: string
  article_type?: "analysis" | "gmp" | "subscription" | "allotment" | "listing"
  generated_by?: string
}

export interface Author {
  slug: string
  name: string
  bio?: string
}

export interface Ipo {
  _id: string;
  upcoming_ipo_2025: string;
  open_date: string;
  closing_date: string;
  slug?: string;
  ipo_type: string;
  ipo_size: string;
  price_band: string;
  about: string;
  image_url: string;
  financial_report: FinancialReport[];
  ipo_dates: IpoDates;
  ipo_details: IpoDetails;
  ipo_name: string;
  ipo_price: string;
  listing_price: string;
  listing_gain: string;
  last_price?: string; // latest close, absent until the prices job reaches the IPO
  ipo_market_lot: IpoMarketLot[];
  promoters: string;
  nii_sr: string;
  // The two NII tiers (S-HNI and B-HNI); absent on older captures, which only have nii_sr.
  snii_sr?: string;
  bnii_sr?: string;
  qib_sr: string;
  rii_sr: string;
  subscription_date_range: string;
  subscription_status: string;
  total_sr: string;
  // The exchange's own "updated as on" time.
  subscription_captured_at?: string;
  // Retail only, from the scraper; the site computes every category's odds with getAllotmentRatio.
  retail_allotment_probability?: number | null;
  // While bidding is open, the probability means "if bidding closed now".
  subscription_is_provisional?: boolean;
  blog?: Blog;
  gmp_current_ipos: string;
  gmp_price_gain: string;
  gmp_ipo_gmp: string;
  gmp_est_listing: string;
  gmp_trend: string;
  gmp_price_band: string;
  gmp_status: string;
  gmp_date: string;
  gmp_subject: string;
  gmp_type: string;
  gmp_updated_at: string;
  // Issue facts as plain values (lib/queries/ipos.ts publicIssue); where each was scraped from never reaches the site.
  issue?: IpoIssue;
  // Valuation ratios by normalised label ("roe", "roce", "price_to_book_value"); keys vary by IPO.
  ipo_valuation?: Record<string, string>;
}

export interface UseOfProceedsItem {
  purpose: string;
  amount_cr: number | null;
  // Share of the listed amounts, so a list sums to 100; not a share of the fresh issue.
  percent: number | null;
}

export interface IpoIssue {
  objects?: UseOfProceedsItem[];
  fresh_issue_cr?: number;
  offer_for_sale_cr?: number;
}

export interface FinancialReport {
  period_ended: string;
  revenue: string;
  expense: string;
  profit_after_tax: string;
  assets: string;
}

export interface IpoMarketLot {
  application: string;
  lot_size: string;
  shares: string;
  amount: string;
}

interface IpoDates {
  ipo_open_date: string;
  ipo_close_date: string;
  basis_of_allotment: string;
  refunds: string;
  credit_to_demat_account: string;
  ipo_listing_date: string;
}

interface IpoDetails {
  ipo_open_date: string;
  ipo_close_date: string;
  face_value: string;
  ipo_price_band: string;
  issue_size: string;
  fresh_issue: string;
  issue_type: string;
  ipo_listing: string;
  retail_quota: string;
  qib_quota: string;
  nii_quota: string;
  drhp_draft_prospectus: string;
  drhp_link: string;
  drhp_draft_prospectus_links: [DocLink];
  rhp_draft_prospectus: string;
  rhp_link: string;
  rhp_draft_prospectus_links: [DocLink];
  anchor_investors_list: string;
  anchor_investors_list_links: [DocLink];
}

interface DocLink {
  text: string;
  href: string;
}
