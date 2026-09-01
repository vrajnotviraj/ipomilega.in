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
  ipo_id: string
  created_at: string
  updated_at: string
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
  detail_url: string;
  scraped_at: string;
  about: string;
  image_url: string;
  financial_report: FinancialReport[];
  ipo_dates: IpoDates;
  ipo_details: IpoDetails;
  ipo_name: string;
  ipo_price: string;
  listing_price: string;
  listing_gain: string;
  ipo_market_lot: IpoMarketLot[],
  promoters: string;
  nii_sr: string;
  qib_sr: string;
  rii_sr: string;
  subscription_date_range: string;
  subscription_scraped_at: string;
  subscription_status: string;
  total_sr: string;
  rhp_url: string;
  blog?: Blog;
  gmp_current_ipos: string;
  gmp_price_gain: string;
  gmp_ipo_gmp: string;
  gmp_date: string;
  gmp_subject: string;
  gmp_type: string;
  gmp_scraped_at: string;
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

export interface IpoDates {
  ipo_open_date: string;
  ipo_close_date: string;
  basis_of_allotment: string;
  refunds: string;
  credit_to_demat_account: string;
  ipo_listing_date: string;
}

export interface IpoDetails {
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
  drhp_draft_prospectus_links: [
    {
      text: string,
      href: string
    }
  ],
  rhp_draft_prospectus: string,
  rhp_link: string,
  rhp_draft_prospectus_links: [
    {
      text: string,
      href: string
    }
  ],
  anchor_investors_list: string,
  anchor_investors_list_links: [
    {
      text: string,
      href: string
    }
  ]
}

