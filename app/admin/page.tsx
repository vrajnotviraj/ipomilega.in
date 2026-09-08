"use client";
import { useEffect, useState, Suspense, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"


import {
  Search, Building2, Calendar, TrendingUp, Shield, ChevronRight, LineChart, PieChart, ChevronLeft, Clock, XCircle, Activity, Loader2, Upload, Copy, Eye, ExternalLink, PenTool, Plus, Edit, Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { HomePageIpoProps } from "../types/homepage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProgressRouter } from "@/components/Progressbar/useProgressRouter"
import { useSearchParams } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Blog } from "../models/ipo";
import { useSession } from "@/lib/auth-client";
import { IpoAnalysisModal } from "@/components/Admin/IpoAnalysisModal";
import SubscriptionCell from "@/components/Admin/SubscriptionCell";
import { getIpoType } from "@/components/Home/ipoFormat";

const getInitials = (name?: string) => {
  if (!name) return "IP";
  return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
};

type FilterType = 'all' | 'live' | 'upcoming' | 'past' | 'recently_added'

function AdminContent() {
  const [ipoList, setIpoList] = useState<HomePageIpoProps[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [upcomingIpoList, setUpcomingIpoList] = useState<HomePageIpoProps[]>([])
  const [liveIpoList, setLiveIpoList] = useState<HomePageIpoProps[]>([])
  const [pastIpoList, setPastIpoList] = useState<HomePageIpoProps[]>([])
  const [recentlyAddedIpoList, setRecentlyAddedIpoList] = useState<HomePageIpoProps[]>([])
  const [blogList, setBlogList] = useState<Blog[]>([])
  const router = useProgressRouter()
  const searchParams = useSearchParams()
  const session = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredIpos, setFilteredIpos] = useState<HomePageIpoProps[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const itemsPerPage = 10

  useEffect(() => {
    if (!session.isPending) {
      const bool = ["admin@gmail.com", "snehshah7634@gmail.com", "shahvraj114@gmail.com", "devanshisoni2004@gmail.com", "devanshisoni2311@gmail.com"].includes(
        session?.data?.user?.email || ""
      );
      setIsAdmin(bool);
      setIsAuthChecking(false);
    }
  }, [session]);

  // Helper function to check if analysis exists for an IPO
  const hasAnalysis = (ipoItem: HomePageIpoProps) => {
    return ipoItem.analysis !== null && ipoItem.analysis !== undefined;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard", { description: text })
  }

  const handleDeleteAnalysis = async (ipoId: string) => {
    if (!confirm("Are you sure you want to delete the analysis for this IPO?")) return;
    try {
      const response = await fetch(`/api/analysis/manipulate-analysis?ipo_table_id=${ipoId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Analysis deleted successfully");
        refreshData();
      } else {
        toast.error(data.error || "Failed to delete analysis");
      }
    } catch (error) {
      console.error("Error deleting analysis:", error);
      toast.error("Error deleting analysis");
    }
  }

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>, ipoId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only image files are allowed")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit")
      return
    }

    const newFileName = `${ipoId}.${file.name.split('.').pop()}`
    const formData = new FormData()
    formData.append('file', new File([file], newFileName, { type: file.type }))
    formData.append('folder', 'logo')
    formData.append('documentId', ipoId)
    formData.append('collection', 'ipos')

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await response.json()
      if (data.success) {
        const updateIpoList = (list: HomePageIpoProps[]) => list.map(item =>
          (String(item.ipo?._id) === String(ipoId) || String(item._id) === String(ipoId))
            ? { ...item, ipo: { ...item.ipo, image_url: data.url } }
            : item
        )
        setFilteredIpos(prev => updateIpoList(prev))
        setIpoList(prev => updateIpoList(prev))
        setUpcomingIpoList(prev => updateIpoList(prev))
        setLiveIpoList(prev => updateIpoList(prev))
        setPastIpoList(prev => updateIpoList(prev))
        toast.success("Logo uploaded successfully")
      } else {
        toast.error(data.error || "Failed to upload logo")
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("Error uploading logo")
    }
  }

  const handleBlogClick = (ipoId: string) => router.push(`/blogs/${ipoId}/create-a-blog`)
  const handleEditBlog = (blogId: string) => window.open(`/blogs/edit-a-blog/${blogId}`, '_blank')
  const getBlogsForIpo = (ipoId: string) => blogList.filter(blog => blog.ipo_id === ipoId)

  useEffect(() => {
    const filterParam = searchParams.get('filter') as FilterType
    if (filterParam && ['all', 'live', 'upcoming', 'past', 'recently_added'].includes(filterParam)) {
      setActiveFilter(filterParam)
    }
  }, [searchParams])

  const refreshData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ipo/upcoming')
      if (!response.ok) throw new Error('Failed to fetch IPO data')
      const data = await response.json()
      setIpoList(data.data.all || [])
      setUpcomingIpoList(data.data.upcoming || [])
      setBlogList(data.data.blogs || [])
      setLiveIpoList(data.data.live || [])
      setPastIpoList(data.data.past || [])
      setRecentlyAddedIpoList(data.data.recently_added || [])
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentIpoList = () => {
    switch (activeFilter) {
      case 'live': return liveIpoList
      case 'upcoming': return upcomingIpoList
      case 'past': return pastIpoList
      case 'recently_added': return recentlyAddedIpoList
      default: return ipoList
    }
  }

  useEffect(() => {
    const currentList = getCurrentIpoList()
    const filtered = currentList.filter(ipoItem =>
      ipoItem.ipo.upcoming_ipo_2025?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ipoItem.ipo.ipo_type?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredIpos(filtered)
    setCurrentPage(1)
  }, [searchQuery, ipoList, liveIpoList, upcomingIpoList, pastIpoList, recentlyAddedIpoList, activeFilter])

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter)
    const url = new URL(window.location.href)
    if (filter === 'all') {
      url.searchParams.delete('filter')
    } else {
      url.searchParams.set('filter', filter)
    }
    window.history.pushState({}, '', url.toString())
  }

  useEffect(() => {
    const fetchIpos = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/ipo/upcoming')
        if (!response.ok) throw new Error('Failed to fetch IPO data')
        const data = await response.json()
        setIpoList(data.data.all || [])
        setUpcomingIpoList(data.data.upcoming || [])
        setBlogList(data.data.blogs || [])
        setLiveIpoList(data.data.live || [])
        setPastIpoList(data.data.past || [])
        setRecentlyAddedIpoList(data.data.recently_added || [])
      } catch (error) {
        console.error("Error fetching IPO data:", error)
        setError('Failed to load IPO data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchIpos()
  }, [])

  const getFilteredStats = () => {
    const currentList = getCurrentIpoList()
    const totalIpos = currentList.length
    const mainboardCount = currentList.filter(ipo => getIpoType(ipo.ipo) === 'Mainboard').length
    const smeCount = totalIpos - mainboardCount
    const totalSize = `${totalIpos * 1500}+ Cr`
    return { totalIpos, mainboardCount, smeCount, totalSize }
  }

  const { totalIpos, mainboardCount, smeCount, totalSize } = getFilteredStats()

  const dashboardStats = [
    { label: "Total IPOs", value: totalIpos.toString(), icon: Building2 },
    { label: "Mainboard IPOs", value: mainboardCount.toString(), icon: TrendingUp },
    { label: "SME IPOs", value: smeCount.toString(), icon: Activity },
    { label: "Total Market Cap", value: totalSize, icon: PieChart }
  ]

  const filterOptions = [
    { value: 'all', label: 'All IPOs', count: ipoList.length, icon: Building2 },
    { value: 'recently_added', label: 'Recently Added', count: recentlyAddedIpoList.length, icon: Plus },
    { value: 'live', label: 'Live IPOs', count: liveIpoList.length, icon: Activity },
    { value: 'upcoming', label: 'Upcoming IPOs', count: upcomingIpoList.length, icon: Calendar },
    { value: 'past', label: 'Past IPOs', count: pastIpoList.length, icon: Clock }
  ]

  const totalPages = Math.ceil(filteredIpos.length / itemsPerPage)
  const currentIpos = filteredIpos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (isAuthChecking) return <LoadingFallback />

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="p-8 text-center flex flex-col items-center gap-4">
            <div className="p-3 bg-destructive/10 text-destructive rounded-full">
              <Shield className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-semibold font-serif text-foreground mt-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This area is restricted to administrators only. Please log in with an authorized administrator account to access this page.
            </p>
            <Button onClick={() => router.push("/")} className="mt-4 w-full h-11">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) return <LoadingFallback />
  if (error) return <ErrorFallback error={error} />

  return (
    <div className="min-h-screen app-container pt-24 pb-16 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-2">
          <div className="text-xs italic text-muted-foreground font-sans mb-1">§ Admin</div>
          <h1 className="text-3xl md:text-4xl font-semibold font-serif text-foreground mb-1">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage IPO listings, analysis matrices and blogs</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardStats.map((stat, index) => (
            <div key={index} className="border border-border rounded-lg bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold font-serif text-foreground">{stat.value}</div>
              <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map(filter => (
            <button
              key={filter.value}
              onClick={() => handleFilterChange(filter.value as FilterType)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-colors text-sm border",
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-accent"
              )}
            >
              <filter.icon className="h-4 w-4" />
              <span>{filter.label}</span>
              <Badge
                variant="secondary"
                className={cn("ml-1 text-[11px] font-mono", activeFilter === filter.value ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}
              >
                {filter.count}
              </Badge>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search IPOs by company name or type..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-10 bg-card border-border h-11 text-sm"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground">
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Table */}
        {currentIpos.length === 0 ? (
          <div className="border border-border rounded-lg bg-card py-16 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-foreground font-medium">No IPOs found</p>
            <p className="mt-1 text-sm text-muted-foreground">{searchQuery ? `No results for "${searchQuery}"` : `No ${activeFilter} IPOs available.`}</p>
            {searchQuery && <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4">Clear Search</Button>}
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Company</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Type</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Open Date</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Close Date</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Price Band</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Issue Size</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Subscription</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Analysis Matrix</th>
                    <th className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentIpos.map(ipoItem => (
                    <tr
                      key={ipoItem._id}
                      className="border-b border-border last:border-b-0 hover:bg-accent/40 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group cursor-pointer w-10 h-10 rounded-full border border-border overflow-hidden flex-shrink-0">
                            <Avatar className="w-full h-full">
                              <AvatarImage src={ipoItem.ipo.image_url} className="object-cover w-full h-full" />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold w-full h-full flex items-center justify-center">
                                {getInitials(ipoItem.ipo.upcoming_ipo_2025 || ipoItem.ipo.ipo_name)}
                              </AvatarFallback>
                            </Avatar>
                            <label className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleLogoUpload(e, ipoItem.ipo._id!)}
                                className="hidden"
                              />
                              <Upload className="h-4 w-4 text-white" />
                            </label>
                          </div>
                          <div className="font-serif font-semibold truncate text-foreground max-w-[200px]" title={ipoItem.ipo.upcoming_ipo_2025}>
                            {ipoItem.ipo.upcoming_ipo_2025}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-mono text-xs uppercase tracking-wide">{getIpoType(ipoItem.ipo)}</Badge>
                      </td>
                      <td className="p-4"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-mono">{ipoItem.ipo.ipo_dates.ipo_open_date}</span></div></td>
                      <td className="p-4"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-mono">{ipoItem.ipo.ipo_dates.ipo_close_date}</span></div></td>
                      <td className="p-4"><div className="font-mono text-sm text-foreground">₹{ipoItem.ipo.price_band}</div></td>
                      <td className="p-4"><div className="font-mono text-sm text-foreground">₹{ipoItem.ipo.ipo_size}</div></td>
                      <td className="p-4"><SubscriptionCell ipo={ipoItem.ipo} /></td>
                      <td className="p-4">
                        {hasAnalysis(ipoItem) ? (
                          <div className="flex flex-col gap-1 text-[11px] font-mono min-w-[200px]">
                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="outline" className="h-6 px-1.5" title="Fundamentals">
                                F: {ipoItem.analysis?.summary_metrics?.fundamentals_score ?? ipoItem.analysis?.fundamentals?.score ?? 0}/10
                              </Badge>
                              <Badge variant="outline" className="h-6 px-1.5" title="Risk Score">
                                R: {ipoItem.analysis?.summary_metrics?.risk_meter ?? ipoItem.analysis?.risk_meter?.score ?? 0}/10
                              </Badge>
                              <Badge variant="outline" className="h-6 px-1.5" title="Performance">
                                P: {ipoItem.analysis?.summary_metrics?.performance_score ?? ipoItem.analysis?.performance?.score ?? 0}/10
                              </Badge>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="outline" className="h-6 px-1.5" title="Flexibility">
                                Fl: {ipoItem.analysis?.summary_metrics?.flexibility_score ?? ipoItem.analysis?.flexibility?.score ?? 0}/10
                              </Badge>
                              <Badge variant="outline" className="h-6 px-1.5" title="Timing">
                                T: {ipoItem.analysis?.summary_metrics?.time_score ?? ipoItem.analysis?.time?.score ?? 0}/10
                              </Badge>
                              <Badge variant="outline" className="h-6 px-1.5 border-score-good/30 bg-score-good/10 text-score-good" title="Listing Gains">
                                G: {ipoItem.analysis?.summary_metrics?.approximate_gains_potential ?? ipoItem.analysis?.ipo_details?.approximate_gains_potential ?? 0}%
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground font-medium h-6 px-2">
                            Pending Analysis
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 actions-cell">
                        <div className="flex items-center gap-2 flex-wrap">
                          <IpoAnalysisModal ipoItem={ipoItem} onAnalysisAdded={refreshData} />
                          <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => router.push(`/analysis/${ipoItem.ipo.slug || ipoItem.analysis?.slug || ipoItem.ipo._id}`)}><LineChart className="h-4 w-4 mr-1.5" />Analysis</Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9 px-3"><PenTool className="h-4 w-4 mr-1.5" />Blog</Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleBlogClick(ipoItem.ipo._id!)}><Plus className="h-4 w-4 mr-2" />Write New</DropdownMenuItem>
                              {getBlogsForIpo(ipoItem.ipo._id!).map(blog => <DropdownMenuItem key={blog._id} onClick={() => handleEditBlog(blog._id!)}><Edit className="h-4 w-4 mr-2" />Edit: {blog.title?.substring(0, 20)}...</DropdownMenuItem>)}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-9 px-3">
                                More
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyToClipboard(ipoItem.ipo._id!)}>
                                <Copy className="h-4 w-4 mr-2" /> Copy ID
                              </DropdownMenuItem>
                              {ipoItem.ipo.detail_url && (
                                <DropdownMenuItem onClick={() => window.open(ipoItem.ipo.detail_url!, '_blank')}>
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                              )}
                              {ipoItem.ipo.ipo_details?.rhp_draft_prospectus_links?.[0]?.href && (
                                <DropdownMenuItem onClick={() => window.open(ipoItem.ipo.ipo_details.rhp_draft_prospectus_links[0].href!, '_blank')}>
                                  <ExternalLink className="h-4 w-4 mr-2 text-score-good" /> RHP Link
                                </DropdownMenuItem>
                              )}
                              {ipoItem.ipo.ipo_details?.drhp_draft_prospectus_links?.[0]?.href && (
                                <DropdownMenuItem onClick={() => window.open(ipoItem.ipo.ipo_details.drhp_draft_prospectus_links[0].href!, '_blank')}>
                                  <ExternalLink className="h-4 w-4 mr-2 text-score-good" /> DRHP Link
                                </DropdownMenuItem>
                              )}
                              {hasAnalysis(ipoItem) && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteAnalysis(ipoItem.ipo._id!)}
                                  className="text-destructive focus:text-destructive font-medium"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Analysis
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border">
              <div className="text-sm text-muted-foreground">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredIpos.length)} of {filteredIpos.length}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-sm text-foreground/80 hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <span className="text-sm text-muted-foreground font-mono">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-sm text-foreground/80 hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center font-sans">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function ErrorFallback({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center font-sans">
      <div className="text-center">
        <Shield className="h-10 w-10 mx-auto text-destructive" />
        <h2 className="mt-4 text-xl font-semibold font-serif text-foreground">Connection Error</h2>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    </div>
  )
}

export default function Admin() {
  return <Suspense fallback={<LoadingFallback />}><AdminContent /></Suspense>
}
