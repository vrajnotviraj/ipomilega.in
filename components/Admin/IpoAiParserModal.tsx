/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Shield,
  Activity,
  Clock,
  LineChart,
  ThumbsUp,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Ipo } from "@/app/models/ipo";

interface IpoAiParserModalProps {
  ipoItem: {
    _id: string;
    ipo: Ipo;
    analysis: any;
  };
  onAnalysisSaved: () => void;
}

export function IpoAiParserModal({ ipoItem, onAnalysisSaved }: IpoAiParserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [markdownPreview, setMarkdownPreview] = useState<string>("");

  const handleParse = async () => {
    if (!inputText.trim()) {
      toast.error("Please paste some text first.");
      return;
    }

    setIsParsing(true);
    try {
      const response = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          companyName: ipoItem.ipo.ipo_name || ipoItem.ipo.upcoming_ipo_2025,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to parse text");

      setParsedData(result.parsedData);
      setMarkdownPreview(result.markdownPreview);
      toast.success("IPO details parsed successfully!");
    } catch (error) {
      console.error("Parse error:", error);
      toast.error(error instanceof Error ? error.message : "Error parsing text");
    } finally {
      setIsParsing(false);
    }
  };

  const handleScoreChange = (section: string, value: string) => {
    const num = Math.min(10, Math.max(1, parseInt(value) || 0));
    setParsedData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        score: num,
      },
    }));
  };

  const handleSummaryScoreChange = (value: string) => {
    const num = Math.min(10, Math.max(1, parseInt(value) || 0));
    setParsedData((prev: any) => ({
      ...prev,
      summary: {
        ...prev.summary,
        profitability_of_allotment: {
          ...prev.summary.profitability_of_allotment,
          score: num,
        },
      },
    }));
  };

  const handleGainsChange = (value: string) => {
    const num = parseFloat(value) || 0;
    setParsedData((prev: any) => ({
      ...prev,
      summary: {
        ...prev.summary,
        approximate_gains_potential: num,
      },
    }));
  };

  // Check for empty pockets (fields with no value)
  const getEmptyPockets = () => {
    if (!parsedData) return [];
    const missing = [];
    if (!parsedData.fundamentals?.score) missing.push("Fundamentals Score");
    if (!parsedData.fundamentals?.summary) missing.push("Fundamentals Summary");
    if (!parsedData.risk_meter?.score) missing.push("Risk Score");
    if (!parsedData.risk_meter?.summary) missing.push("Risk Summary");
    if (!parsedData.flexibility?.score) missing.push("Flexibility Score");
    if (!parsedData.performance?.score) missing.push("Performance Score");
    if (!parsedData.time?.score) missing.push("Timing Score");
    if (!parsedData.summary?.approximate_gains_potential) missing.push("Listing Gain %");
    if (!parsedData.summary?.profitability_of_allotment?.score) missing.push("Allotment Score");
    return missing;
  };

  const handleSave = async () => {
    if (!parsedData) return;

    setIsSaving(true);
    try {
      const payload = {
        ipo_table_id: ipoItem.ipo._id,
        company_name: ipoItem.ipo.ipo_name || ipoItem.ipo.upcoming_ipo_2025 || "Unknown Company",
        image_url: ipoItem.ipo.image_url || "",
        investorSplit: parsedData.investorSplit || ipoItem.ipo.ipo_market_lot || [],
        slug: ipoItem.ipo.slug || "",
        gmp_price_gain: ipoItem.ipo.gmp_price_gain || "",
        financialReport: parsedData.financialReport || ipoItem.ipo.financial_report || [],
        fundamentals: parsedData.fundamentals || {},
        risk_meter: parsedData.risk_meter || {},
        flexibility: parsedData.flexibility || {},
        time: parsedData.time || {},
        performance: parsedData.performance || {},
        ipo_details: {
          issue_size: ipoItem.ipo.ipo_size || "",
          price_band: ipoItem.ipo.price_band || "",
          lot_size: parseInt(ipoItem.ipo.ipo_market_lot?.[0]?.lot_size || "0") || 0,
          shares: parseInt(ipoItem.ipo.ipo_market_lot?.[0]?.shares || "0") || 0,
          allocation_details: {
            retail: parseFloat(ipoItem.ipo.ipo_details?.retail_quota || "35") || 35,
            qib: parseFloat(ipoItem.ipo.ipo_details?.qib_quota || "50") || 50,
            nii: parseFloat(ipoItem.ipo.ipo_details?.nii_quota || "15") || 15,
          },
          approximate_gains_potential: parsedData.summary?.approximate_gains_potential || 0,
          gains_rationale: parsedData.summary?.gains_rationale || "",
          profitability_of_allotment: parsedData.summary?.profitability_of_allotment || {
            score: 0,
            assessment: "",
          },
        },
        summary_metrics: {
          fundamentals_score: parsedData.fundamentals?.score || 0,
          risk_meter: parsedData.risk_meter?.score || 0,
          flexibility_score: parsedData.flexibility?.score || 0,
          time_score: parsedData.time?.score || 0,
          performance_score: parsedData.performance?.score || 0,
          approximate_gains_potential: parsedData.summary?.approximate_gains_potential || 0,
          profitability_of_allotment: parsedData.summary?.profitability_of_allotment?.score || 0,
          total_revenue: parsedData.fundamentals?.revenue_details?.total_revenue || 0,
          net_profit: parsedData.fundamentals?.profit_analysis?.net_profit || 0,
          total_assets: parsedData.fundamentals?.assets_and_liabilities?.total_assets || 0,
        },
      };

      const response = await fetch("/api/analysis/manipulate-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to save analysis");

      toast.success("Comprehensive analysis saved successfully!");
      setIsOpen(false);
      onAnalysisSaved();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "Error saving analysis");
    } finally {
      setIsSaving(false);
    }
  };

  const emptyPockets = getEmptyPockets();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 text-sm border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold"
        >
          <Sparkles className="h-4 w-4 mr-1.5 text-blue-600 animate-pulse" />
          AI Parser
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col font-ibm-plex p-0 overflow-hidden rounded-xl bg-white shadow-2xl">
        <DialogHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50/20 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  AI Matrix Parser
                </span>
                <p className="text-sm font-medium text-gray-600 mt-1">
                  Parse prospectus text for {ipoItem.ipo.ipo_name || ipoItem.ipo.upcoming_ipo_2025}
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-row overflow-hidden min-h-0 bg-gray-50/40">
          {/* Left Panel: Pasting Input */}
          <div className="w-1/3 border-r bg-white p-6 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center gap-2 font-bold text-gray-800 text-base">
              <FileText className="h-5 w-5 text-blue-600" />
              Raw Context Text
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Paste the text extracted from the RHP, official documents, or websites below. The AI will parse it to fill all scoring and description fields.
            </p>
            <Textarea
              placeholder="Paste company business description, SWOT analysis, financials, management info, risks, dates, or other prospectus text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 min-h-[350px] resize-none border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans text-sm rounded-lg"
            />
            <Button
              onClick={handleParse}
              disabled={isParsing || !inputText.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 transition-all rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Parsing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Parse with AI
                </>
              )}
            </Button>
          </div>

          {/* Right Panel: Parser Outputs */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {parsedData ? (
              <div className="flex-1 flex flex-row overflow-hidden">
                {/* Markdown Preview Column */}
                <div className="w-1/2 border-r p-6 overflow-y-auto bg-white flex flex-col gap-4">
                  <div className="font-bold text-gray-800 text-base flex items-center gap-2 sticky top-0 bg-white pb-2 border-b">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Markdown Presentation Preview
                  </div>
                  <div className="prose prose-blue max-w-none text-sm leading-relaxed text-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {markdownPreview}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Interactive Matrix Inputs Column */}
                <div className="w-1/2 p-6 overflow-y-auto flex flex-col gap-6">
                  <div className="font-bold text-gray-800 text-base flex items-center gap-2 pb-2 border-b">
                    <LineChart className="h-5 w-5 text-indigo-600" />
                    Analysis Scores Matrix
                  </div>

                  {/* Empty Pockets Alert */}
                  {emptyPockets.length > 0 ? (
                    <Card className="border-amber-200 bg-amber-50 shadow-sm rounded-lg">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-bold text-amber-900 block mb-1">
                            Missing Pockets ({emptyPockets.length})
                          </span>
                          <span className="text-amber-800 text-xs">
                            The following pockets are empty. Fill them in or re-parse:
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {emptyPockets.map((p) => (
                              <Badge
                                key={p}
                                variant="outline"
                                className="border-amber-300 bg-white text-amber-800 text-[10px] font-bold"
                              >
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex items-center gap-2 text-green-700 text-sm font-bold bg-green-50 p-3 rounded-lg border border-green-200">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      All pockets successfully filled!
                    </div>
                  )}

                  {/* Edit Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <LineChart className="h-3.5 w-3.5 text-purple-600" />
                        Fundamentals Score (1-10)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={parsedData.fundamentals?.score || ""}
                        onChange={(e) => handleScoreChange("fundamentals", e.target.value)}
                        className="bg-white border-gray-200 focus:ring-blue-500 rounded-lg text-sm h-10"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5 text-red-600" />
                        Risk Score (1-10)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={parsedData.risk_meter?.score || ""}
                        onChange={(e) => handleScoreChange("risk_meter", e.target.value)}
                        className="bg-white border-gray-200 focus:ring-blue-500 rounded-lg text-sm h-10"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                        Performance Score (1-10)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={parsedData.performance?.score || ""}
                        onChange={(e) => handleScoreChange("performance", e.target.value)}
                        className="bg-white border-gray-200 focus:ring-blue-500 rounded-lg text-sm h-10"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5 text-blue-600" />
                        Flexibility Score (1-10)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={parsedData.flexibility?.score || ""}
                        onChange={(e) => handleScoreChange("flexibility", e.target.value)}
                        className="bg-white border-gray-200 focus:ring-blue-500 rounded-lg text-sm h-10"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-orange-600" />
                        Timing Score (1-10)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={parsedData.time?.score || ""}
                        onChange={(e) => handleScoreChange("time", e.target.value)}
                        className="bg-white border-gray-200 focus:ring-blue-500 rounded-lg text-sm h-10"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5 text-emerald-600" />
                        Listing Gains Potential (%)
                      </label>
                      <Input
                        type="number"
                        value={parsedData.summary?.approximate_gains_potential ?? ""}
                        onChange={(e) => handleGainsChange(e.target.value)}
                        className="bg-white border-gray-200 focus:ring-blue-500 rounded-lg text-sm h-10"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5 text-indigo-600" />
                        Allotment Profitability Score (1-10)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={parsedData.summary?.profitability_of_allotment?.score || ""}
                        onChange={(e) => handleSummaryScoreChange(e.target.value)}
                        className="bg-white border-gray-200 focus:ring-blue-500 rounded-lg text-sm h-10"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Market Position Description
                    </label>
                    <Textarea
                      value={parsedData.fundamentals?.market_position || ""}
                      onChange={(e) =>
                        setParsedData((prev: any) => ({
                          ...prev,
                          fundamentals: {
                            ...prev.fundamentals,
                            market_position: e.target.value,
                          },
                        }))
                      }
                      className="bg-white border-gray-200 focus:ring-blue-500 text-xs rounded-lg min-h-[60px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">
                      Risk Summary
                    </label>
                    <Textarea
                      value={parsedData.risk_meter?.summary || ""}
                      onChange={(e) =>
                        setParsedData((prev: any) => ({
                          ...prev,
                          risk_meter: {
                            ...prev.risk_meter,
                            summary: e.target.value,
                          },
                        }))
                      }
                      className="bg-white border-gray-200 focus:ring-blue-500 text-xs rounded-lg min-h-[60px]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 bg-gray-50/20">
                <Sparkles className="h-16 w-16 text-blue-200 mb-4 animate-pulse" />
                <h3 className="font-bold text-lg text-gray-800">
                  Ready to Parse
                </h3>
                <p className="text-sm max-w-md mt-2 text-gray-500">
                  Paste the raw prospectus text on the left panel, and click {"Parse with AI"} to generate the structured Analysis Matrix.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/10 flex-shrink-0 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="text-gray-500 font-bold hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !parsedData}
            className="bg-green-600 hover:bg-green-700 text-white font-bold h-11 px-6 shadow-md hover:shadow-lg flex items-center gap-2 rounded-lg transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Analysis...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Analysis
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
