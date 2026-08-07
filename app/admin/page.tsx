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
        const updateIpoList = (list: HomePageIpoProps[]) => list.map(ipo => ipo.ipo._id === ipoId ? { ...ipo, ipo: { ...ipo.ipo, image_url: data.url } } : ipo)
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
    const mainboardCount = currentList.filter(ipo => ipo.ipo.ipo_type === 'Mainboard').length
    const smeCount = totalIpos - mainboardCount
    const totalSize = `${totalIpos * 1500}+ Cr`
    return { totalIpos, mainboardCount, smeCount, totalSize }
  }

  const { totalIpos, mainboardCount, smeCount, totalSize } = getFilteredStats()

  const dashboardStats = [
    { label: "Total IPOs", value: totalIpos.toString(), icon: Building2, color: "text-[#0073E6]" },
    { label: "Mainboard IPOs", value: mainboardCount.toString(), icon: TrendingUp, color: "text-[#00914D]" },
    { label: "SME IPOs", value: smeCount.toString(), icon: Activity, color: "text-[#B4292E]" },
    { label: "Total Market Cap", value: totalSize, icon: PieChart, color: "text-[#D59527]" }
  ]

  console.log("isAdmin", isAdmin)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-ibm-plex">
        <Card className="w-full max-w-md bg-white border border-red-100 shadow-xl rounded-xl">
          <CardContent className="p-8 text-center flex flex-col items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-full">
              <Shield className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mt-2">Access Denied</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              This area is restricted to administrators only. Please log in with an authorized administrator account to access this page.
            </p>
            <Button onClick={() => router.push("/")} className="mt-4 bg-[#0073E6] hover:bg-[#0059b3] text-white font-bold w-full h-11 rounded-lg">
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
    <div className="min-h-screen app-container bg-gradient-to-br from-blue-50 mt-10 via-white to-gray-50 px-4 py-8 font-ibm-plex">
      <div className="container mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 lg:justify-start">
          {filterOptions.map(filter => (
            <button key={filter.value} onClick={() => handleFilterChange(filter.value as FilterType)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all duration-200 shadow-md border text-sm", activeFilter === filter.value ? "bg-[#0073E6] text-white shadow-lg" : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:shadow-lg")}>
              <filter.icon className="h-4 w-4" />
              <span>{filter.label}</span>
              <Badge variant="secondary" className={cn("ml-1 text-xs font-bold", activeFilter === filter.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600")}>{filter.count}</Badge>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={cn("h-8 w-8", stat.color, "group-hover:scale-110 transition-transform")} />
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-gray-900">{stat.value}</div>
                  <div className="text-sm font-bold text-gray-900">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input placeholder="Search IPOs by company name or type..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-10 bg-white/50 h-12 border-gray-200 focus:border-[#0073E6] focus:ring-[#0073E6]" />
              {searchQuery && <Button variant="ghost" size="icon" onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600"><XCircle className="h-4 w-4" /></Button>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg">
          {currentIpos.length === 0 ? (
            <CardContent className="py-16 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-4 text-lg font-black text-gray-900">No IPOs found</p>
              <p className="mt-2 text-sm text-gray-600">{searchQuery ? `No results for "${searchQuery}"` : `No ${activeFilter} IPOs available.`}</p>
              {searchQuery && <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-4 border-[#0073E6]/20 hover:bg-[#0073E6]/10 text-[#0073E6] font-bold">Clear Search</Button>}
            </CardContent>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-gray-50/80">
                    <tr className="border-b">
                      <th className="font-black text-left p-4 text-gray-900">Company</th>
                      <th className="font-black text-left p-4 text-gray-900">Type</th>
                      <th className="font-black text-left p-4 text-gray-900">Open Date</th>
                      <th className="font-black text-left p-4 text-gray-900">Close Date</th>
                      <th className="font-black text-left p-4 text-gray-900">Price Band</th>
                      <th className="font-black text-left p-4 text-gray-900">Issue Size</th>
                      <th className="font-black text-left p-4 text-gray-900">Analysis Matrix</th>
                      <th className="font-black text-left p-4 text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentIpos.map(ipoItem => (
                      <tr
                        key={ipoItem._id}
                        className="group hover:bg-gray-50/80 border-b border-gray-100 cursor-pointer select-none"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative group cursor-pointer w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0">
                              <Avatar className="w-full h-full">
                                <AvatarImage src={ipoItem.ipo.image_url} className="object-cover w-full h-full" />
                                <AvatarFallback className="bg-[#0073E6]/10 text-[#0073E6] font-bold w-full h-full flex items-center justify-center">
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
                            <div className="font-black truncate text-gray-900 max-w-[200px]" title={ipoItem.ipo.upcoming_ipo_2025}>
                              {ipoItem.ipo.upcoming_ipo_2025}
                            </div>
                          </div>
                        </td>
                        <td className="p-4"><Badge variant={ipoItem.ipo.ipo_type === 'Mainboard' ? 'default' : 'secondary'} className="font-bold bg-[#0073E6] text-white">{ipoItem.ipo.ipo_type}</Badge></td>
                        <td className="p-4"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><span className="text-sm font-medium">{ipoItem.ipo.ipo_dates.ipo_open_date}</span></div></td>
                        <td className="p-4"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><span className="text-sm font-medium">{ipoItem.ipo.ipo_dates.ipo_close_date}</span></div></td>
                        <td className="p-4"><div className="font-black">₹{ipoItem.ipo.price_band}</div></td>
                        <td className="p-4"><div className="font-black">₹{ipoItem.ipo.ipo_size}</div></td>
                        <td className="p-4">
                          {hasAnalysis(ipoItem) ? (
                            <div className="flex flex-col gap-1 text-[11px] font-bold min-w-[200px]">
                              <div className="flex gap-1 flex-wrap">
                                <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 h-6 px-1.5" title="Fundamentals">
                                  F: {ipoItem.analysis?.summary_metrics?.fundamentals_score ?? ipoItem.analysis?.fundamentals?.score ?? 0}/10
                                </Badge>
                                <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 h-6 px-1.5" title="Risk Score">
                                  R: {ipoItem.analysis?.summary_metrics?.risk_meter ?? ipoItem.analysis?.risk_meter?.score ?? 0}/10
                                </Badge>
                                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 h-6 px-1.5" title="Performance">
                                  P: {ipoItem.analysis?.summary_metrics?.performance_score ?? ipoItem.analysis?.performance?.score ?? 0}/10
                                </Badge>
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 h-6 px-1.5" title="Flexibility">
                                  Fl: {ipoItem.analysis?.summary_metrics?.flexibility_score ?? ipoItem.analysis?.flexibility?.score ?? 0}/10
                                </Badge>
                                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 h-6 px-1.5" title="Timing">
                                  T: {ipoItem.analysis?.summary_metrics?.time_score ?? ipoItem.analysis?.time?.score ?? 0}/10
                                </Badge>
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 h-6 px-1.5" title="Listing Gains">
                                  G: {ipoItem.analysis?.summary_metrics?.approximate_gains_potential ?? ipoItem.analysis?.ipo_details?.approximate_gains_potential ?? 0}%
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-500 font-bold h-6 px-2">
                              Pending Analysis
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 actions-cell">
                          <div className="flex items-center gap-2 flex-wrap">
                            <IpoAnalysisModal ipoItem={ipoItem} onAnalysisSaved={refreshData} />
                            <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => router.push(`/analysis/${ipoItem.ipo.slug || ipoItem.analysis?.slug || ipoItem.ipo._id}`)}><LineChart className="h-4 w-4 mr-1.5 text-red-600" />Analysis</Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9 px-3"><PenTool className="h-4 w-4 mr-1.5 text-primary" />Blog</Button></DropdownMenuTrigger>
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
                                  <Copy className="h-4 w-4 mr-2 text-primary" /> Copy ID
                                </DropdownMenuItem>
                                {ipoItem.ipo.detail_url && (
                                  <DropdownMenuItem onClick={() => window.open(ipoItem.ipo.detail_url!, '_blank')}>
                                    <Eye className="h-4 w-4 mr-2 text-primary" /> View Details
                                  </DropdownMenuItem>
                                )}
                                {ipoItem.ipo.ipo_details?.rhp_draft_prospectus_links?.[0]?.href && (
                                  <DropdownMenuItem onClick={() => window.open(ipoItem.ipo.ipo_details.rhp_draft_prospectus_links[0].href!, '_blank')}>
                                    <ExternalLink className="h-4 w-4 mr-2 text-green-600" /> RHP Link
                                  </DropdownMenuItem>
                                )}
                                {ipoItem.ipo.ipo_details?.drhp_draft_prospectus_links?.[0]?.href && (
                                  <DropdownMenuItem onClick={() => window.open(ipoItem.ipo.ipo_details.drhp_draft_prospectus_links[0].href!, '_blank')}>
                                    <ExternalLink className="h-4 w-4 mr-2 text-green-600" /> DRHP Link
                                  </DropdownMenuItem>
                                )}
                                {hasAnalysis(ipoItem) && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteAnalysis(ipoItem.ipo._id!)}
                                    className="text-red-650 focus:text-red-750 font-bold"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2 text-red-600" /> Delete Analysis
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
              {/* Mobile view can be added here if needed */}
              <CardContent className="p-6 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredIpos.length)} of {filteredIpos.length}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4 mr-1" />Prev</Button>
                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
}

function ErrorFallback({ error }: { error: string }) {
  return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><Shield className="h-10 w-10 mx-auto text-red-500" /><h2 className="mt-4 text-xl font-bold">Connection Error</h2><p className="text-gray-600">{error}</p><Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button></div></div>
}

export default function Admin() {
  return <Suspense fallback={<LoadingFallback />}><AdminContent /></Suspense>
}
