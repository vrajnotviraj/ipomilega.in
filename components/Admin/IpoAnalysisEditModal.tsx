/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  Edit,
  Plus,
  TrendingUp,
  Shield,
  Activity,
  Clock,
  LineChart,
  ThumbsUp,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { Ipo } from "@/app/models/ipo";

interface IpoAnalysisEditModalProps {
  ipoItem: {
    _id: string;
    ipo: Ipo;
    analysis?: any;
  };
  onAnalysisAdded: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function IpoAnalysisEditModal({ 
  ipoItem, 
  onAnalysisAdded,
  externalOpen,
  onExternalOpenChange
}: IpoAnalysisEditModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (onExternalOpenChange !== undefined) {
      onExternalOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };
  const [isSaving, setIsSaving] = useState(false);

  // Form states grouped by category
  const [fundamentals, setFundamentals] = useState({
    score: 5,
    summary: "",
    market_position: "",
    business_model: "",
    total_revenue: 0,
    revenue_cagr: 0,
    revenue_trend: "",
    net_profit: 0,
    profit_margin: 0,
    ebitda: 0,
    profit_trend: "",
    total_assets: 0,
    total_liabilities: 0,
    debt_to_equity_ratio: 0,
    current_ratio: "",
    quick_ratio: "",
    return_on_equity: "",
  });

  const [performance, setPerformance] = useState({
    score: 5,
    summary: "",
    growth_pattern: "",
    growth_rate: "",
    growth_consistency: "",
    key_achievements: "",
    mgmt_experience: "",
    mgmt_track_record: "",
    mgmt_score: 5,
    market_comparison: "",
    growth_forecast: "",
    upcoming_projects: "",
    operational_years: 0,
    revenue_stability: "",
    rationale: "",
  });

  const [riskMeter, setRiskMeter] = useState({
    score: 5,
    summary: "",
    key_risks: "",
    risk_mitigation: "",
  });

  const [flexibility, setFlexibility] = useState({
    score: 5,
    summary: "",
    market_adaptability_score: 5,
    market_adaptability_desc: "",
    financial_stability_score: 5,
    financial_stability_desc: "",
    operational_agility_score: 5,
    operational_agility_desc: "",
    product_diversification: "",
  });

  const [time, setTime] = useState({
    score: 5,
    summary: "",
    allotment_process: "",
    market_timing_assessment: "",
    time_to_market_score: 5,
    time_to_market_rationale: "",
  });

  const [summaryGains, setSummaryGains] = useState({
    gains_potential: 0,
    gains_rationale: "",
    allotment_score: 5,
    allotment_assessment: "",
  });

  // Pre-load existing data when opening modal
  useEffect(() => {
    if (isOpen) {
      const existing = ipoItem.analysis;
      if (existing) {
        setFundamentals({
          score: existing.fundamentals?.score ?? 5,
          summary: existing.fundamentals?.summary ?? "",
          market_position: existing.fundamentals?.market_position ?? "",
          business_model: existing.fundamentals?.business_model ?? "",
          total_revenue: existing.fundamentals?.revenue_details?.total_revenue ?? 0,
          revenue_cagr: existing.fundamentals?.revenue_details?.revenue_cagr ?? 0,
          revenue_trend: existing.fundamentals?.revenue_details?.revenue_trend ?? "",
          net_profit: existing.fundamentals?.profit_analysis?.net_profit ?? 0,
          profit_margin: existing.fundamentals?.profit_analysis?.profit_margin ?? 0,
          ebitda: existing.fundamentals?.profit_analysis?.ebitda ?? 0,
          profit_trend: existing.fundamentals?.profit_analysis?.profit_trend ?? "",
          total_assets: existing.fundamentals?.assets_and_liabilities?.total_assets ?? 0,
          total_liabilities: existing.fundamentals?.assets_and_liabilities?.total_liabilities ?? 0,
          debt_to_equity_ratio: existing.fundamentals?.assets_and_liabilities?.debt_to_equity_ratio ?? 0,
          current_ratio: existing.fundamentals?.financial_ratios?.current_ratio ?? "",
          quick_ratio: existing.fundamentals?.financial_ratios?.quick_ratio ?? "",
          return_on_equity: existing.fundamentals?.financial_ratios?.return_on_equity ?? "",
        });

        setPerformance({
          score: existing.performance?.score ?? 5,
          summary: existing.performance?.summary ?? "",
          growth_pattern: existing.performance?.historical_growth?.pattern ?? "",
          growth_rate: existing.performance?.historical_growth?.rate ?? "",
          growth_consistency: existing.performance?.historical_growth?.consistency ?? "",
          key_achievements: existing.performance?.key_achievements?.join("\n") ?? "",
          mgmt_experience: existing.performance?.management_quality?.experience ?? "",
          mgmt_track_record: existing.performance?.management_quality?.track_record ?? "",
          mgmt_score: existing.performance?.management_quality?.score ?? 5,
          market_comparison: existing.performance?.market_comparison ?? "",
          growth_forecast: existing.performance?.future_potential?.growth_forecast ?? "",
          upcoming_projects: existing.performance?.future_potential?.upcoming_projects?.join("\n") ?? "",
          operational_years: existing.performance?.consistency_analysis?.operational_years ?? 0,
          revenue_stability: existing.performance?.consistency_analysis?.revenue_stability ?? "",
          rationale: existing.performance?.consistency_analysis?.rationale ?? "",
        });

        setRiskMeter({
          score: existing.risk_meter?.score ?? 5,
          summary: existing.risk_meter?.summary ?? "",
          key_risks: existing.risk_meter?.key_risks?.join("\n") ?? "",
          risk_mitigation: existing.risk_meter?.risk_mitigation ?? "",
        });

        setFlexibility({
          score: existing.flexibility?.score ?? 5,
          summary: existing.flexibility?.summary ?? "",
          market_adaptability_score: existing.flexibility?.market_adaptability?.score ?? 5,
          market_adaptability_desc: existing.flexibility?.market_adaptability?.description ?? "",
          financial_stability_score: existing.flexibility?.financial_stability?.score ?? 5,
          financial_stability_desc: existing.flexibility?.financial_stability?.description ?? "",
          operational_agility_score: existing.flexibility?.operational_agility?.score ?? 5,
          operational_agility_desc: existing.flexibility?.operational_agility?.description ?? "",
          product_diversification: existing.flexibility?.product_diversification ?? "",
        });

        setTime({
          score: existing.time?.score ?? 5,
          summary: existing.time?.summary ?? "",
          allotment_process: existing.time?.allotment_timeline?.process ?? "",
          market_timing_assessment: existing.time?.market_timing_assessment ?? "",
          time_to_market_score: existing.time?.time_to_market?.score ?? 5,
          time_to_market_rationale: existing.time?.time_to_market?.rationale ?? "",
        });

        setSummaryGains({
          gains_potential: existing.ipo_details?.approximate_gains_potential ?? existing.summary?.approximate_gains_potential ?? 0,
          gains_rationale: existing.ipo_details?.gains_rationale ?? existing.summary?.gains_rationale ?? "",
          allotment_score: existing.ipo_details?.profitability_of_allotment?.score ?? existing.summary?.profitability_of_allotment?.score ?? 5,
          allotment_assessment: existing.ipo_details?.profitability_of_allotment?.assessment ?? existing.summary?.profitability_of_allotment?.assessment ?? "",
        });
      } else {
        // Reset states to default
        setFundamentals({
          score: 5,
          summary: "",
          market_position: "",
          business_model: "",
          total_revenue: 0,
          revenue_cagr: 0,
          revenue_trend: "",
          net_profit: 0,
          profit_margin: 0,
          ebitda: 0,
          profit_trend: "",
          total_assets: 0,
          total_liabilities: 0,
          debt_to_equity_ratio: 0,
          current_ratio: "",
          quick_ratio: "",
          return_on_equity: "",
        });
        setPerformance({
          score: 5,
          summary: "",
          growth_pattern: "",
          growth_rate: "",
          growth_consistency: "",
          key_achievements: "",
          mgmt_experience: "",
          mgmt_track_record: "",
          mgmt_score: 5,
          market_comparison: "",
          growth_forecast: "",
          upcoming_projects: "",
          operational_years: 0,
          revenue_stability: "",
          rationale: "",
        });
        setRiskMeter({
          score: 5,
          summary: "",
          key_risks: "",
          risk_mitigation: "",
        });
        setFlexibility({
          score: 5,
          summary: "",
          market_adaptability_score: 5,
          market_adaptability_desc: "",
          financial_stability_score: 5,
          financial_stability_desc: "",
          operational_agility_score: 5,
          operational_agility_desc: "",
          product_diversification: "",
        });
        setTime({
          score: 5,
          summary: "",
          allotment_process: "",
          market_timing_assessment: "",
          time_to_market_score: 5,
          time_to_market_rationale: "",
        });
        setSummaryGains({
          gains_potential: 0,
          gains_rationale: "",
          allotment_score: 5,
          allotment_assessment: "",
        });
      }
    }
  }, [isOpen, ipoItem]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const existing = ipoItem.analysis || {};

      const payload = {
        ipo_table_id: ipoItem.ipo._id,
        company_name: ipoItem.ipo.ipo_name || ipoItem.ipo.upcoming_ipo_2025 || "Unknown Company",
        image_url: ipoItem.ipo.image_url || "",
        investorSplit: ipoItem.ipo.ipo_market_lot || [],
        slug: ipoItem.ipo.slug || "",
        gmp_price_gain: ipoItem.ipo.gmp_price_gain || "",
        financialReport: ipoItem.ipo.financial_report || [],
        fundamentals: {
          score: fundamentals.score,
          summary: fundamentals.summary,
          market_position: fundamentals.market_position,
          business_model: fundamentals.business_model,
          revenue_details: {
            total_revenue: Number(fundamentals.total_revenue),
            revenue_cagr: Number(fundamentals.revenue_cagr),
            revenue_trend: fundamentals.revenue_trend,
          },
          profit_analysis: {
            net_profit: Number(fundamentals.net_profit),
            profit_margin: Number(fundamentals.profit_margin),
            ebitda: Number(fundamentals.ebitda),
            profit_trend: fundamentals.profit_trend,
          },
          assets_and_liabilities: {
            total_assets: Number(fundamentals.total_assets),
            total_liabilities: Number(fundamentals.total_liabilities),
            debt_to_equity_ratio: Number(fundamentals.debt_to_equity_ratio),
          },
          financial_ratios: {
            current_ratio: fundamentals.current_ratio,
            quick_ratio: fundamentals.quick_ratio,
            return_on_equity: fundamentals.return_on_equity,
          },
        },
        risk_meter: {
          score: riskMeter.score,
          summary: riskMeter.summary,
          key_risks: riskMeter.key_risks.split("\n").filter((r) => r.trim() !== ""),
          risk_categories: existing.risk_meter?.risk_categories || {
            financial_risks: [],
            market_risks: [],
            operational_risks: [],
            regulatory_risks: [],
          },
          risk_mitigation: riskMeter.risk_mitigation,
        },
        flexibility: {
          score: flexibility.score,
          summary: flexibility.summary,
          market_adaptability: {
            score: flexibility.market_adaptability_score,
            description: flexibility.market_adaptability_desc,
          },
          financial_stability: {
            score: flexibility.financial_stability_score,
            description: flexibility.financial_stability_desc,
          },
          operational_agility: {
            score: flexibility.operational_agility_score,
            description: flexibility.operational_agility_desc,
          },
          product_diversification: flexibility.product_diversification,
          pivoting_history: existing.flexibility?.pivoting_history || [],
          future_adaptability_potential: existing.flexibility?.future_adaptability_potential || "",
        },
        time: {
          score: time.score,
          summary: time.summary,
          issue_dates: existing.time?.issue_dates || { opening: "", closing: "" },
          listing_details: existing.time?.listing_details || { expected_date: "", exchanges: [] },
          allotment_timeline: {
            date: existing.time?.allotment_timeline?.date || "",
            process: time.allotment_process,
          },
          key_milestones: existing.time?.key_milestones || [],
          market_timing_assessment: time.market_timing_assessment,
          time_to_market: {
            score: time.time_to_market_score,
            rationale: time.time_to_market_rationale,
          },
        },
        performance: {
          score: performance.score,
          summary: performance.summary,
          historical_growth: {
            pattern: performance.growth_pattern,
            rate: performance.growth_rate,
            consistency: performance.growth_consistency,
          },
          key_achievements: performance.key_achievements.split("\n").filter((r) => r.trim() !== ""),
          management_quality: {
            experience: performance.mgmt_experience,
            track_record: performance.mgmt_track_record,
            score: performance.mgmt_score,
          },
          market_comparison: performance.market_comparison,
          future_potential: {
            growth_forecast: performance.growth_forecast,
            upcoming_projects: performance.upcoming_projects.split("\n").filter((r) => r.trim() !== ""),
          },
          consistency_analysis: {
            operational_years: Number(performance.operational_years),
            revenue_stability: performance.revenue_stability,
            rationale: performance.rationale,
          },
        },
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
          approximate_gains_potential: Number(summaryGains.gains_potential),
          gains_rationale: summaryGains.gains_rationale,
          profitability_of_allotment: {
            score: Number(summaryGains.allotment_score),
            assessment: summaryGains.allotment_assessment,
          },
        },
        summary_metrics: {
          fundamentals_score: fundamentals.score,
          risk_meter: riskMeter.score,
          flexibility_score: flexibility.score,
          time_score: time.score,
          performance_score: performance.score,
          approximate_gains_potential: Number(summaryGains.gains_potential),
          profitability_of_allotment: Number(summaryGains.allotment_score),
          total_revenue: Number(fundamentals.total_revenue),
          net_profit: Number(fundamentals.net_profit),
          total_assets: Number(fundamentals.total_assets),
        },
      };

      const response = await fetch("/api/analysis/manipulate-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to save analysis");

      toast.success("Analysis matrix updated successfully!");
      setIsOpen(false);
      onAnalysisAdded();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "Error saving updates");
    } finally {
      setIsSaving(false);
    }
  };

  const hasExisting = !!ipoItem.analysis;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            hasExisting
              ? "h-9 px-3 text-sm font-bold border-blue-600/20 hover:bg-blue-600/10 text-blue-600"
              : "h-9 px-3 text-sm font-bold border-green-600/20 hover:bg-green-600/10 text-green-600"
          }
        >
          {hasExisting ? <Edit className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
          {hasExisting ? "Edit Matrix" : "Add Matrix"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col font-ibm-plex p-0 overflow-hidden rounded-xl bg-white shadow-2xl">
        <DialogHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50/20 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
                <Edit className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  {hasExisting ? "Edit Analysis Matrix" : "Initialize Analysis Matrix"}
                </span>
                <p className="text-sm font-medium text-gray-600 mt-1">
                  IPO: {ipoItem.ipo.ipo_name || ipoItem.ipo.upcoming_ipo_2025}
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="fundamentals" className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TabsList className="px-6 border-b bg-gray-50/50 justify-start rounded-none h-12 flex-shrink-0 flex gap-4">
            <TabsTrigger value="fundamentals" className="font-bold flex items-center gap-1.5"><LineChart className="h-4 w-4" />Fundamentals</TabsTrigger>
            <TabsTrigger value="performance" className="font-bold flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />Performance</TabsTrigger>
            <TabsTrigger value="risks" className="font-bold flex items-center gap-1.5"><Shield className="h-4 w-4" />Risks</TabsTrigger>
            <TabsTrigger value="flexibility" className="font-bold flex items-center gap-1.5"><Activity className="h-4 w-4" />Flexibility</TabsTrigger>
            <TabsTrigger value="timeline" className="font-bold flex items-center gap-1.5"><Clock className="h-4 w-4" />Timeline</TabsTrigger>
            <TabsTrigger value="verdict" className="font-bold flex items-center gap-1.5"><ThumbsUp className="h-4 w-4" />Verdict & Gains</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/20">
            {/* Tab: Fundamentals */}
            <TabsContent value="fundamentals" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Fundamentals Score (1-10)</label>
                  <Input type="number" min={1} max={10} value={fundamentals.score} onChange={(e) => setFundamentals(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Total Revenue (latest year, in INR)</label>
                  <Input type="number" value={fundamentals.total_revenue} onChange={(e) => setFundamentals(prev => ({ ...prev, total_revenue: parseFloat(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Revenue CAGR (%)</label>
                  <Input type="number" value={fundamentals.revenue_cagr} onChange={(e) => setFundamentals(prev => ({ ...prev, revenue_cagr: parseFloat(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Net Profit (latest year, in INR)</label>
                  <Input type="number" value={fundamentals.net_profit} onChange={(e) => setFundamentals(prev => ({ ...prev, net_profit: parseFloat(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Profit Margin (%)</label>
                  <Input type="number" value={fundamentals.profit_margin} onChange={(e) => setFundamentals(prev => ({ ...prev, profit_margin: parseFloat(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">EBITDA (in INR)</label>
                  <Input type="number" value={fundamentals.ebitda} onChange={(e) => setFundamentals(prev => ({ ...prev, ebitda: parseFloat(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Total Assets (in INR)</label>
                  <Input type="number" value={fundamentals.total_assets} onChange={(e) => setFundamentals(prev => ({ ...prev, total_assets: parseFloat(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Total Liabilities (in INR)</label>
                  <Input type="number" value={fundamentals.total_liabilities} onChange={(e) => setFundamentals(prev => ({ ...prev, total_liabilities: parseFloat(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Debt-to-Equity Ratio</label>
                  <Input type="number" step="0.01" value={fundamentals.debt_to_equity_ratio} onChange={(e) => setFundamentals(prev => ({ ...prev, debt_to_equity_ratio: parseFloat(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Current Ratio</label>
                  <Input value={fundamentals.current_ratio} placeholder="e.g. 1.5:1" onChange={(e) => setFundamentals(prev => ({ ...prev, current_ratio: e.target.value }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Quick Ratio</label>
                  <Input value={fundamentals.quick_ratio} placeholder="e.g. 1.2:1" onChange={(e) => setFundamentals(prev => ({ ...prev, quick_ratio: e.target.value }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Return on Equity (ROE)</label>
                  <Input value={fundamentals.return_on_equity} placeholder="e.g. 15%" onChange={(e) => setFundamentals(prev => ({ ...prev, return_on_equity: e.target.value }))} className="bg-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Fundamentals Summary</label>
                <Textarea value={fundamentals.summary} placeholder="Overall financial overview..." onChange={(e) => setFundamentals(prev => ({ ...prev, summary: e.target.value }))} className="bg-white min-h-[60px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Market Position</label>
                  <Textarea value={fundamentals.market_position} placeholder="Market share and moat..." onChange={(e) => setFundamentals(prev => ({ ...prev, market_position: e.target.value }))} className="bg-white min-h-[80px]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Business Model</label>
                  <Textarea value={fundamentals.business_model} placeholder="Revenue generation and scalability..." onChange={(e) => setFundamentals(prev => ({ ...prev, business_model: e.target.value }))} className="bg-white min-h-[80px]" />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Performance */}
            <TabsContent value="performance" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Performance Score (1-10)</label>
                  <Input type="number" min={1} max={10} value={performance.score} onChange={(e) => setPerformance(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Management Quality Score (1-10)</label>
                  <Input type="number" min={1} max={10} value={performance.mgmt_score} onChange={(e) => setPerformance(prev => ({ ...prev, mgmt_score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Operational Years</label>
                  <Input type="number" value={performance.operational_years} onChange={(e) => setPerformance(prev => ({ ...prev, operational_years: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Growth Pattern</label>
                  <Input value={performance.growth_pattern} placeholder="e.g. Consistent Growth" onChange={(e) => setPerformance(prev => ({ ...prev, growth_pattern: e.target.value }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Growth Rate</label>
                  <Input value={performance.growth_rate} placeholder="e.g. 20% CAGR" onChange={(e) => setPerformance(prev => ({ ...prev, growth_rate: e.target.value }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Growth Consistency</label>
                  <Input value={performance.growth_consistency} placeholder="e.g. High" onChange={(e) => setPerformance(prev => ({ ...prev, growth_consistency: e.target.value }))} className="bg-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Performance Summary</label>
                <Textarea value={performance.summary} placeholder="Overview of company performance..." onChange={(e) => setPerformance(prev => ({ ...prev, summary: e.target.value }))} className="bg-white min-h-[60px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Management Experience</label>
                  <Textarea value={performance.mgmt_experience} placeholder="Experience details..." onChange={(e) => setPerformance(prev => ({ ...prev, mgmt_experience: e.target.value }))} className="bg-white min-h-[60px]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Management Track Record</label>
                  <Textarea value={performance.mgmt_track_record} placeholder="Execution success track record..." onChange={(e) => setPerformance(prev => ({ ...prev, mgmt_track_record: e.target.value }))} className="bg-white min-h-[60px]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Key Achievements (One per line)</label>
                  <Textarea value={performance.key_achievements} placeholder="Achievement 1&#10;Achievement 2" onChange={(e) => setPerformance(prev => ({ ...prev, key_achievements: e.target.value }))} className="bg-white min-h-[80px]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Upcoming Projects (One per line)</label>
                  <Textarea value={performance.upcoming_projects} placeholder="Project 1&#10;Project 2" onChange={(e) => setPerformance(prev => ({ ...prev, upcoming_projects: e.target.value }))} className="bg-white min-h-[80px]" />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Risks */}
            <TabsContent value="risks" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Risk Score (1-10, lower is better)</label>
                  <Input type="number" min={1} max={10} value={riskMeter.score} onChange={(e) => setRiskMeter(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Risk Summary</label>
                <Textarea value={riskMeter.summary} placeholder="Summary of risks..." onChange={(e) => setRiskMeter(prev => ({ ...prev, summary: e.target.value }))} className="bg-white min-h-[60px]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Key Risks (One per line)</label>
                <Textarea value={riskMeter.key_risks} placeholder="Risk 1&#10;Risk 2" onChange={(e) => setRiskMeter(prev => ({ ...prev, key_risks: e.target.value }))} className="bg-white min-h-[100px]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Risk Mitigation</label>
                <Textarea value={riskMeter.risk_mitigation} placeholder="Mitigation details..." onChange={(e) => setRiskMeter(prev => ({ ...prev, risk_mitigation: e.target.value }))} className="bg-white min-h-[60px]" />
              </div>
            </TabsContent>

            {/* Tab: Flexibility */}
            <TabsContent value="flexibility" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Flexibility Score (1-10)</label>
                  <Input type="number" min={1} max={10} value={flexibility.score} onChange={(e) => setFlexibility(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Market Adaptability Score (1-10)</label>
                  <Input type="number" min={1} max={10} value={flexibility.market_adaptability_score} onChange={(e) => setFlexibility(prev => ({ ...prev, market_adaptability_score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Financial Stability Score (1-10)</label>
                  <Input type="number" min={1} max={10} value={flexibility.financial_stability_score} onChange={(e) => setFlexibility(prev => ({ ...prev, financial_stability_score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Operational Agility Score (1-10)</label>
                  <Input type="number" min={1} max={10} value={flexibility.operational_agility_score} onChange={(e) => setFlexibility(prev => ({ ...prev, operational_agility_score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Flexibility Summary</label>
                <Textarea value={flexibility.summary} placeholder="Overview of adaptability..." onChange={(e) => setFlexibility(prev => ({ ...prev, summary: e.target.value }))} className="bg-white min-h-[60px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Market Adaptability Description</label>
                  <Textarea value={flexibility.market_adaptability_desc} onChange={(e) => setFlexibility(prev => ({ ...prev, market_adaptability_desc: e.target.value }))} className="bg-white min-h-[60px]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Financial Stability Description</label>
                  <Textarea value={flexibility.financial_stability_desc} onChange={(e) => setFlexibility(prev => ({ ...prev, financial_stability_desc: e.target.value }))} className="bg-white min-h-[60px]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Operational Agility Description</label>
                  <Textarea value={flexibility.operational_agility_desc} onChange={(e) => setFlexibility(prev => ({ ...prev, operational_agility_desc: e.target.value }))} className="bg-white min-h-[60px]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Product Diversification</label>
                  <Textarea value={flexibility.product_diversification} onChange={(e) => setFlexibility(prev => ({ ...prev, product_diversification: e.target.value }))} className="bg-white min-h-[60px]" />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Timeline */}
            <TabsContent value="timeline" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Timing Score (1-10)</label>
                  <Input type="number" min={1} max={10} value={time.score} onChange={(e) => setTime(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Time to Market Score (1-10)</label>
                  <Input type="number" min={1} max={10} value={time.time_to_market_score} onChange={(e) => setTime(prev => ({ ...prev, time_to_market_score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Timeline Summary</label>
                <Textarea value={time.summary} placeholder="Overview of timing..." onChange={(e) => setTime(prev => ({ ...prev, summary: e.target.value }))} className="bg-white min-h-[60px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Allotment Timeline Process</label>
                  <Textarea value={time.allotment_process} onChange={(e) => setTime(prev => ({ ...prev, allotment_process: e.target.value }))} className="bg-white min-h-[60px]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Market Timing Assessment</label>
                  <Textarea value={time.market_timing_assessment} onChange={(e) => setTime(prev => ({ ...prev, market_timing_assessment: e.target.value }))} className="bg-white min-h-[60px]" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Time to Market Rationale</label>
                <Textarea value={time.time_to_market_rationale} onChange={(e) => setTime(prev => ({ ...prev, time_to_market_rationale: e.target.value }))} className="bg-white min-h-[60px]" />
              </div>
            </TabsContent>

            {/* Tab: Verdict & Gains */}
            <TabsContent value="verdict" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-emerald-600" />
                    Listing Gains Potential (%)
                  </label>
                  <Input type="number" value={summaryGains.gains_potential} onChange={(e) => setSummaryGains(prev => ({ ...prev, gains_potential: parseFloat(e.target.value) || 0 }))} className="bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5 text-indigo-600" />
                    Allotment Profitability Score (1-10)
                  </label>
                  <Input type="number" min={1} max={10} value={summaryGains.allotment_score} onChange={(e) => setSummaryGains(prev => ({ ...prev, allotment_score: parseInt(e.target.value) || 0 }))} className="bg-white" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Listing Gains Rationale</label>
                <Textarea value={summaryGains.gains_rationale} placeholder="Rationale for potential gains..." onChange={(e) => setSummaryGains(prev => ({ ...prev, gains_rationale: e.target.value }))} className="bg-white min-h-[60px]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700">Allotment Assessment Recommendation</label>
                <Textarea value={summaryGains.allotment_assessment} placeholder="Recommendation description..." onChange={(e) => setSummaryGains(prev => ({ ...prev, allotment_assessment: e.target.value }))} className="bg-white min-h-[60px]" />
              </div>
            </TabsContent>
          </div>
        </Tabs>

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
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white font-bold h-11 px-6 shadow-md hover:shadow-lg flex items-center gap-2 rounded-lg transition-all"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Matrix
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
