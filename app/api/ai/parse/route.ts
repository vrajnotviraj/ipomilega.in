import { NextRequest, NextResponse } from "next/server";
import { stripCitations } from "@/lib/citations";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { text, companyName } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "Text is required for parsing" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OpenAI API key not configured on server" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert financial analyst. Your task is to parse unstructured text about an IPO for the company "${companyName || "the company"}" and extract structured data matching the comprehensive analysis schema.

You MUST return a JSON object with two fields:
1. "parsedData": A JSON object matching the exact schema below.
2. "markdownPreview": A beautifully styled Markdown summary of the analysis suitable for presentation. It should include headers, tables of scores, key strengths, key risks, and allotment viability.

JSON Schema for "parsedData":
{
  "fundamentals": {
    "score": number (1-10, where 10 is outstanding and 1 is poor),
    "summary": "string (comprehensive financial overview, max 40 words)",
    "market_position": "string (market position and competitive moat analysis, max 30 words)",
    "business_model": "string (business model and revenue generation, max 30 words)",
    "revenue_details": {
      "total_revenue": number (latest year total revenue in INR, e.g. 1500000000. Use 0 if not found),
      "revenue_cagr": number (CAGR percentage, e.g. 15.5. Use 0 if not found),
      "revenue_trend": "string (revenue growth pattern, max 25 words)"
    },
    "profit_analysis": {
      "net_profit": number (latest year net profit in INR. Use 0 if not found),
      "profit_margin": number (percentage as number, e.g. 12.5. Use 0 if not found),
      "ebitda": number (EBITDA in INR or 0 if not found),
      "profit_trend": "string (profitability analysis, max 25 words)"
    },
    "assets_and_liabilities": {
      "total_assets": number (latest assets in INR. Use 0 if not found),
      "total_liabilities": number (latest liabilities in INR. Use 0 if not found),
      "debt_to_equity_ratio": number (D/E ratio as decimal, e.g. 0.4. Use 0 if not found)
    },
    "financial_ratios": {
      "current_ratio": "string (e.g. '1.5:1' or 'N/A')",
      "quick_ratio": "string (e.g. '1.2:1' or 'N/A')",
      "return_on_equity": "string (e.g. '15%' or 'N/A')"
    },
    "debt": {
      "total_debt": "string (total borrowings, e.g. '₹120 Cr' or 'Debt-free'. null if not stated)",
      "summary": "string (how heavy the debt is and whether IPO money repays it, max 30 words)"
    },
    "offer_structure": {
      "fresh_issue": "string (fresh issue size, e.g. '₹200 Cr'. null if none)",
      "offer_for_sale": "string (offer for sale size, e.g. '₹100 Cr'. null if none)",
      "promoters_selling": boolean (true if promoters sell shares in the OFS),
      "selling_shareholders": "string (who is selling in the OFS, or 'None')",
      "why_selling": "string (what the fresh money is for and why existing holders are selling, max 50 words)"
    }
  },
  "risk_meter": {
    "score": number (1-10, where 1 is lowest risk and 10 is highest risk. Max 10),
    "summary": "string (brief risk profile, max 40 words)",
    "key_risks": ["array of 5 significant risks with descriptions"],
    "risk_categories": {
      "financial_risks": ["array of 2 specific financial risks"],
      "market_risks": ["array of 2 market/competition risks"],
      "operational_risks": ["array of 2 operational risks"],
      "regulatory_risks": ["array of 2 regulatory/legal risks"]
    },
    "risk_mitigation": "string (mitigation steps summary, max 35 words)"
  },
  "flexibility": {
    "score": number (1-10),
    "summary": "string (adaptability assessment, max 40 words)",
    "market_adaptability": {
      "score": number (1-10),
      "description": "string (max 25 words)"
    },
    "financial_stability": {
      "score": number (1-10),
      "description": "string (max 25 words)"
    },
    "operational_agility": {
      "score": number (1-10),
      "description": "string (max 25 words)"
    },
    "product_diversification": "string (diversification level, max 25 words)",
    "pivoting_history": ["array of 3 specific adaptation events or pivots"],
    "future_adaptability_potential": "string (adaptability outlook, max 25 words)"
  },
  "performance": {
    "score": number (1-10),
    "summary": "string (performance evaluation, max 40 words)",
    "historical_growth": {
      "pattern": "string (growth style, e.g., 'Consistent Growth')",
      "rate": "string (growth rate, e.g., '22% CAGR')",
      "consistency": "string (growth stability, e.g., 'High')"
    },
    "key_achievements": ["array of 4 milestones or awards"],
    "management_quality": {
      "experience": "string (management experience summary, max 30 words)",
      "track_record": "string (execution track record, max 30 words)",
      "score": number (1-10)
    },
    "market_comparison": "string (peer comparison, max 30 words)",
    "future_potential": {
      "growth_forecast": "string (growth projection, max 30 words)",
      "upcoming_projects": ["array of 2 upcoming projects"]
    },
    "consistency_analysis": {
      "operational_years": number (years of operation),
      "revenue_stability": "string (revenue stability level)",
      "rationale": "string (consistency rationale, max 30 words)"
    }
  },
  "time": {
    "score": number (1-10),
    "summary": "string (timing analysis, max 40 words)",
    "issue_dates": {
      "opening": "string (YYYY-MM-DD format if found, otherwise '')",
      "closing": "string (YYYY-MM-DD format if found, otherwise '')"
    },
    "listing_details": {
      "expected_date": "string (YYYY-MM-DD format if found, otherwise '')",
      "exchanges": ["array of exchanges, e.g. NSE, BSE"]
    },
    "allotment_timeline": {
      "date": "string (YYYY-MM-DD format if found, otherwise '')",
      "process": "string (allotment process, max 25 words)"
    },
    "key_milestones": [
      {
        "date": "string (YYYY-MM-DD or text date)",
        "event": "string (milestone description)"
      }
    ],
    "market_timing_assessment": "string (timing conditions, max 30 words)",
    "time_to_market": {
      "score": number (1-10),
      "rationale": "string (timing score rationale, max 30 words)"
    }
  },
  "summary": {
    "approximate_gains_potential": number (listing gain percentage as number, e.g. 35.0),
    "gains_rationale": "string (listing gains explanation, max 40 words)",
    "profitability_of_allotment": {
      "score": number (1-10),
      "assessment": "string (recommendation summary, max 40 words)"
    }
  },
  "investorSplit": [
    {
      "application": "string (e.g. Retail, QIB, NII)",
      "lot_size": "string (e.g. '1 Lot (14 Shares)')",
      "shares": "string (e.g. '14')",
      "amount": "string (e.g. '₹14,980')"
    }
  ],
  "financialReport": [
    {
      "period_ended": "string (e.g. '31-Mar-2025')",
      "revenue": "string (e.g. '₹1,250 Cr')",
      "expense": "string (e.g. '₹1,020 Cr')",
      "profit_after_tax": "string (e.g. '₹120 Cr')",
      "assets": "string (e.g. '₹2,100 Cr')"
    }
  ]
}

Ensure you fill as many empty pockets as possible using details in the text. Make reasonable estimates based on the financials if details are not explicitly present.
`;

    const chatResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      return NextResponse.json(
        { success: false, error: `OpenAI API Error: ${chatResponse.status} - ${errorText}` },
        { status: 500 }
      );
    }

    const data = await chatResponse.json();
    const rawResult = data.choices[0]?.message?.content;

    if (!rawResult) {
      return NextResponse.json(
        { success: false, error: "Empty response from OpenAI" },
        { status: 500 }
      );
    }

    const parsedResult = JSON.parse(rawResult);

    return NextResponse.json({
      success: true,
      // Pasted Gemini text carries "[cite: N]" markers the model copies straight through.
      parsedData: stripCitations(parsedResult.parsedData),
      markdownPreview: stripCitations(parsedResult.markdownPreview),
    });
  } catch (error) {
    console.error("AI Parsing Route error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
