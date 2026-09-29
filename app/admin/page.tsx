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
import { cn, getInitials } from "@/lib/utils"
import { HomePageIpoProps } from "@/types/homepage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProgressRouter } from "@/hooks/useProgressRouter"
import { useSearchParams } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Blog } from "@/types/ipo";
import { useSession, isAdminEmail } from "@/lib/auth-client";
import { IpoAnalysisModal } from "@/components/admin/IpoAnalysisModal";
import SubscriptionCell from "@/components/admin/SubscriptionCell";
import ServiceStatus from "@/components/admin/ServiceStatus";
import { getIpoType } from "@/lib/ipo-format";

const FILTERS = ['all', 'live', 'upcoming', 'past', 'recently_added'] as const
const ITEMS_PER_PAGE = 10
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const TABLE_HEADERS = ["Company", "Type", "Open Date", "Close Date", "Price Band", "Issue Size", "Subscription", "Analysis Matrix", "Actions"]

type FilterType = typeof FILTERS[number]
type IpoLists = Record<FilterType, HomePageIpoProps[]>

const EMPTY_LISTS: IpoLists = { all: [], live: [], upcoming: [], past: [], recently_added: [] }

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  toast.success("Copied to clipboard", { description: text })
}

function AdminContent() {
  const router = useProgressRouter()
  const searchParams = useSearchParams()
  const session = useSession()
  const [lists, setLists] = useState<IpoLists>(EMPTY_LISTS)
  const [blogList, setBlogList] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const isAdmin = isAdminEmail(session?.data?.user?.email)

  const loadIpos = async (onError: (error: unknown) => void) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ipo/upcoming')
      if (!response.ok) throw new Error('Failed to fetch IPO data')
      const { data } = await response.json()
      setLists({
        all: data.all || [],
        live: data.live || [],
        upcoming: data.upcoming || [],
        past: data.past || [],
        recently_added: data.recently_added || [],
      })
      setBlogList(data.blogs || [])
    } catch (error) {
      onError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => loadIpos(error => console.error("Error refreshing data:", error))

  useEffect(() => {
    loadIpos(error => {
      console.error("Error fetching IPO data:", error)
      setError('Failed to load IPO data')
    })
  }, [])

  useEffect(() => {
    const filterParam = searchParams.get('filter') as FilterType
    if (FILTERS.includes(filterParam)) setActiveFilter(filterParam)
  }, [searchParams])

  useEffect(() => setCurrentPage(1), [searchQuery, lists, activeFilter])

  const handleDeleteAnalysis = async (ipoId: string) => {
    if (!confirm("Are you sure you want to delete the analysis for this IPO?")) return;
    try {
      const response = await fetch(`/api/analysis/manipulate-analysis?ipo_table_id=${ipoId}`, { method: 'DELETE' });
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
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Only image files are allowed")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit")
      return
    }

    const formData = new FormData()
    formData.append('file', new File([file], `${ipoId}.${file.name.split('.').pop()}`, { type: file.type }))
    formData.append('folder', 'logo')
    formData.append('documentId', ipoId)
    formData.append('collection', 'ipos')

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await response.json()
      if (!data.success) {
        toast.error(data.error || "Failed to upload logo")
        return
      }
      const withNewLogo = (list: HomePageIpoProps[]) => list.map(item =>
        (String(item.ipo?._id) === String(ipoId) || String(item._id) === String(ipoId))
          ? { ...item, ipo: { ...item.ipo, image_url: data.url } }
          : item
      )
      // recently_added keeps the old logo until the next load.
      setLists(prev => ({
        ...prev,
        all: withNewLogo(prev.all),
        live: withNewLogo(prev.live),
        upcoming: withNewLogo(prev.upcoming),
        past: withNewLogo(prev.past),
      }))
      toast.success("Logo uploaded successfully")
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("Error uploading logo")
    }
  }

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter)
    const url = new URL(window.location.href)
    if (filter === 'all') url.searchParams.delete('filter')
    else url.searchParams.set('filter', filter)
    window.history.pushState({}, '', url.toString())
  }

  const currentList = lists[activeFilter]
  const query = searchQuery.toLowerCase()
  const filteredIpos = currentList.filter(ipoItem =>
    ipoItem.ipo.upcoming_ipo_2025?.toLowerCase().includes(query) ||
    ipoItem.ipo.ipo_type?.toLowerCase().includes(query)
  )
  const mainboardCount = currentList.filter(ipo => getIpoType(ipo.ipo) === 'Mainboard').length

  const dashboardStats = [
    { label: "Total IPOs", value: currentList.length.toString(), icon: Building2 },
    { label: "Mainboard IPOs", value: mainboardCount.toString(), icon: TrendingUp },
    { label: "SME IPOs", value: (currentList.length - mainboardCount).toString(), icon: Activity },
    { label: "Total Market Cap", value: `${currentList.length * 1500}+ Cr`, icon: PieChart }
  ]

  const filterOptions = [
    { value: 'all', label: 'All IPOs', icon: Building2 },
    { value: 'recently_added', label: 'Recently Added', icon: Plus },
    { value: 'live', label: 'Live IPOs', icon: Activity },
    { value: 'upcoming', label: 'Upcoming IPOs', icon: Calendar },
    { value: 'past', label: 'Past IPOs', icon: Clock }
  ] as const

  const totalPages = Math.ceil(filteredIpos.length / ITEMS_PER_PAGE)
  const currentIpos = filteredIpos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (session.isPending) return <LoadingFallback />

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
      <div className="space-y-6">
        <div className="mb-2">
          <div className="text-xs italic text-muted-foreground font-sans mb-1">§ Admin</div>
          <h1 className="text-3xl md:text-4xl font-semibold font-serif text-foreground mb-1">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage IPO listings, analysis matrices and blogs</p>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardStats.map(stat => (
            <div key={stat.label} className="border border-border rounded-lg bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-2xl font-semibold font-serif text-foreground">{stat.value}</div>
              <div className="text-xs font-mono uppercase tracking-wide text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map(filter => (
            <button
              key={filter.value}
              onClick={() => handleFilterChange(filter.value)}
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
                {lists[filter.value].length}
              </Badge>
            </button>
          ))}
        </div>

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
                    {TABLE_HEADERS.map(header => (
                      <th key={header} className="text-left text-xs font-mono uppercase tracking-wide text-muted-foreground font-medium px-4 py-3">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentIpos.map(ipoItem => {
                    const { ipo, analysis } = ipoItem
                    const ipoId = ipo._id!
                    return (
                      <tr
                        key={ipoItem._id}
                        className="border-b border-border last:border-b-0 hover:bg-accent/40 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative group cursor-pointer w-10 h-10 rounded-full border border-border overflow-hidden flex-shrink-0">
                              <Avatar className="w-full h-full">
                                <AvatarImage src={ipo.image_url} className="object-cover w-full h-full" />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold w-full h-full flex items-center justify-center">
                                  {getInitials(ipo.upcoming_ipo_2025 || ipo.ipo_name || "") || "IP"}
                                </AvatarFallback>
                              </Avatar>
                              <label className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleLogoUpload(e, ipoId)}
                                  className="hidden"
                                />
                                <Upload className="h-4 w-4 text-white" />
                              </label>
                            </div>
                            <div className="font-serif font-semibold truncate text-foreground max-w-[200px]" title={ipo.upcoming_ipo_2025}>
                              {ipo.upcoming_ipo_2025}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="font-mono text-xs uppercase tracking-wide">{getIpoType(ipo)}</Badge>
                        </td>
                        <td className="p-4"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-mono">{ipo.ipo_dates.ipo_open_date}</span></div></td>
                        <td className="p-4"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-mono">{ipo.ipo_dates.ipo_close_date}</span></div></td>
                        <td className="p-4"><div className="font-mono text-sm text-foreground">₹{ipo.price_band}</div></td>
                        <td className="p-4"><div className="font-mono text-sm text-foreground">₹{ipo.ipo_size}</div></td>
                        <td className="p-4"><SubscriptionCell ipo={ipo} /></td>
                        <td className="p-4">
                          {analysis ? (
                            <div className="flex flex-col gap-1 text-[11px] font-mono min-w-[200px]">
                              <div className="flex gap-1 flex-wrap">
                                <Badge variant="outline" className="h-6 px-1.5" title="Fundamentals">
                                  F: {analysis.summary_metrics?.fundamentals_score ?? analysis.fundamentals?.score ?? 0}/10
                                </Badge>
                                <Badge variant="outline" className="h-6 px-1.5" title="Risk Score">
                                  R: {analysis.summary_metrics?.risk_meter ?? analysis.risk_meter?.score ?? 0}/10
                                </Badge>
                                <Badge variant="outline" className="h-6 px-1.5" title="Performance">
                                  P: {analysis.summary_metrics?.performance_score ?? analysis.performance?.score ?? 0}/10
                                </Badge>
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                <Badge variant="outline" className="h-6 px-1.5" title="Flexibility">
                                  Fl: {analysis.summary_metrics?.flexibility_score ?? analysis.flexibility?.score ?? 0}/10
                                </Badge>
                                <Badge variant="outline" className="h-6 px-1.5" title="Timing">
                                  T: {analysis.summary_metrics?.time_score ?? analysis.time?.score ?? 0}/10
                                </Badge>
                                <Badge variant="outline" className="h-6 px-1.5 border-score-good/30 bg-score-good/10 text-score-good" title="Listing Gains">
                                  G: {analysis.summary_metrics?.approximate_gains_potential ?? analysis.ipo_details?.approximate_gains_potential ?? 0}%
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
                            <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => router.push(`/analysis/${ipo.slug || analysis?.slug || ipo._id}`)}><LineChart className="h-4 w-4 mr-1.5" />Analysis</Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9 px-3"><PenTool className="h-4 w-4 mr-1.5" />Blog</Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/blogs/${ipoId}/create-a-blog`)}><Plus className="h-4 w-4 mr-2" />Write New</DropdownMenuItem>
                                {blogList.filter(blog => blog.ipo_id === ipoId).map(blog => (
                                  <DropdownMenuItem key={blog._id} onClick={() => window.open(`/blogs/edit-a-blog/${blog._id}`, '_blank')}><Edit className="h-4 w-4 mr-2" />Edit: {blog.title?.substring(0, 20)}...</DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 px-3">
                                  More
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => copyToClipboard(ipoId)}>
                                  <Copy className="h-4 w-4 mr-2" /> Copy ID
                                </DropdownMenuItem>
                                {ipo.detail_url && (
                                  <DropdownMenuItem onClick={() => window.open(ipo.detail_url!, '_blank')}>
                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                )}
                                {ipo.ipo_details?.rhp_draft_prospectus_links?.[0]?.href && (
                                  <DropdownMenuItem onClick={() => window.open(ipo.ipo_details.rhp_draft_prospectus_links[0].href!, '_blank')}>
                                    <ExternalLink className="h-4 w-4 mr-2 text-score-good" /> RHP Link
                                  </DropdownMenuItem>
                                )}
                                {ipo.ipo_details?.drhp_draft_prospectus_links?.[0]?.href && (
                                  <DropdownMenuItem onClick={() => window.open(ipo.ipo_details.drhp_draft_prospectus_links[0].href!, '_blank')}>
                                    <ExternalLink className="h-4 w-4 mr-2 text-score-good" /> DRHP Link
                                  </DropdownMenuItem>
                                )}
                                {analysis && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteAnalysis(ipoId)}
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
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border">
              <div className="text-sm text-muted-foreground">Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredIpos.length)} of {filteredIpos.length}</div>
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

        <ServiceStatus />
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
