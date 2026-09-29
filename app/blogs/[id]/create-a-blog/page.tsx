"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Building2, Image as ImageIcon } from "lucide-react"
import { toast } from "react-toastify"
import { Ipo } from "@/types/ipo"
import { useSession } from "@/lib/auth-client"
import MarkdownRenderer from "@/components/blog/MarkDown"
import { useProgressRouter } from "@/hooks/useProgressRouter"
import {
  type BlogFields, slugify, withField, LoadingScreen, EditorHeader, IpoSummary, EditorFields, SidebarCards,
} from "@/components/blog/BlogEditor"

type NewPost = BlogFields & { status: "draft" | "published"; image_url?: string; author: string }

const formatDate = (date?: string) => (date ? new Date(date).toLocaleDateString("en-IN") : "To be announced")

/** Markdown outline for a new IPO analysis post, prefilled with the IPO's key facts. */
const starterContent = (ipo: Ipo) => {
  const companyName = ipo.upcoming_ipo_2025 || "Company Name"
  return `# ${companyName} IPO: Complete Analysis & Investment Guide

## Overview

${companyName} is set to launch its Initial Public Offering (IPO) in 2025, marking a significant milestone for the company and presenting an exciting opportunity for investors.

## IPO Details

### Key Information
- **Company:** ${companyName}
- **IPO Type:** ${ipo.ipo_type || "IPO Type"}
- **Price Band:** ${ipo.price_band || "To be announced"}
- **Issue Size:** ${ipo.ipo_size || "To be announced"}
- **Open Date:** ${formatDate(ipo.open_date)}
- **Close Date:** ${formatDate(ipo.closing_date)}

## Company Background

[Write about the company's history, business model, and market position]

## Financial Analysis

### Revenue & Profitability
[Add financial highlights and key metrics]

### Growth Prospects
[Discuss future growth opportunities and market potential]

## IPO Analysis

### Valuation
[Analyze the IPO pricing and valuation metrics]

### Use of Proceeds
[Explain how the company plans to use the IPO funds]

### Risk Factors
[Highlight key risks investors should consider]

## Investment Recommendation

### Pros
- [List positive factors]

### Cons
- [List concerns or risks]

### Final Verdict
[Provide your investment recommendation]

## How to Apply

[Include step-by-step guide for IPO application]

## Conclusion

[Summarize key points and final thoughts]

---

*This analysis is for informational purposes only and should not be considered as investment advice. Please consult with a financial advisor before making investment decisions.*`
}

export default function CreateBlogPage() {
  const params = useParams()
  const router = useProgressRouter()
  const session = useSession()
  const ipoId = params.id as string
  const [ipo, setIpo] = useState<Ipo | null>(null)
  const [isLoadingIpo, setIsLoadingIpo] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [slugExists, setSlugExists] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [blogPost, setBlogPost] = useState<NewPost>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    tags: [],
    category: "IPO Analysis",
    status: "draft",
    meta_description: "",
    author: "Admin",
  })

  useEffect(() => {
    if (!ipoId) return
    const loadIpo = async () => {
      try {
        setIsLoadingIpo(true)
        const ipoResponse = await fetch(`/api/ipo/${ipoId}`)
        const analysisResponse = await fetch(`/api/analysis/${ipoId}`)
        if (!ipoResponse.ok || !analysisResponse.ok) throw new Error("Failed to fetch IPO data")

        const loaded: Ipo = (await ipoResponse.json()).ipos
        await analysisResponse.json()
        setIpo(loaded)
        if (!loaded) return

        const name = loaded.upcoming_ipo_2025
        setBlogPost((prev) => ({
          ...prev,
          title: `${name} IPO Analysis: Complete Review & Investment Guide`,
          slug: slugify(`${name}-ipo-analysis`),
          excerpt: `Comprehensive analysis of ${name} IPO including price band, issue size, and investment recommendations.`,
          meta_description: `Complete review of ${name} IPO - Price: ${loaded.price_band}, Size: ${loaded.ipo_size}. Expert analysis and investment guide.`,
          tags: [name, loaded.ipo_type, "IPO 2025", "Stock Market"],
          content: starterContent(loaded),
        }))
      } catch (error) {
        console.error("Error fetching IPO data:", error)
        toast.error("Failed to load IPO data")
      } finally {
        setIsLoadingIpo(false)
      }
    }
    loadIpo()
  }, [ipoId])

  // Frees the previous preview's object URL whenever it changes or the page unmounts.
  useEffect(() => () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
  }, [imagePreviewUrl])

  const updateField = (field: keyof NewPost, value: NewPost[keyof NewPost]) =>
    setBlogPost((prev) => withField(prev, field, value))

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  /** Uploads the selected image and returns its URL. */
  const uploadImage = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "blogs")
    formData.append("documentId", ipoId)
    formData.append("collection", "blogs")

    const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData })
    if (!uploadResponse.ok) throw new Error("Image upload request failed")
    const uploadResult = await uploadResponse.json()
    if (!uploadResult.success) throw new Error(uploadResult.error || "Image upload failed")
    return uploadResult.url
  }

  const handleSave = async (status: "draft" | "published") => {
    try {
      setIsSaving(true)

      const slugData = await (await fetch(`/api/blogs/slug/exists/${blogPost.slug}`)).json()
      if (slugData.exists) {
        setSlugExists(true)
        toast.error("Blog with this slug already exists")
        return
      }

      const imageUrl = selectedImage ? await uploadImage(selectedImage) : blogPost.image_url
      const now = new Date().toISOString()
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...blogPost, status, ipo_id: ipoId, image_url: imageUrl, created_at: now, updated_at: now }),
      })
      if (!response.ok) throw new Error("Failed to save blog post")

      toast.success(status === "published" ? "Blog published successfully!" : "Draft saved successfully!")
      router.push(`/admin`)
    } catch (error) {
      console.error("Error saving blog post:", error)
      toast.error((error as Error).message || "Failed to save blog post")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingIpo) return <LoadingScreen title="Loading IPO Data..." subtitle="Preparing blog editor" />

  const previewImage = imagePreviewUrl || blogPost.image_url

  return (
    <div className="min-h-screen bg-background pt-16">
      <EditorHeader
        title="Create Blog Post"
        subtitle={<>{ipo?.upcoming_ipo_2025} IPO Analysis</>}
        isPreviewMode={isPreviewMode}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <div className="app-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {ipo && (
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <IpoSummary ipo={ipo} />
                    </div>
                    <Badge variant="secondary">Reference IPO</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <FileText className="h-5 w-5" />
                  {isPreviewMode ? "Preview" : "Blog Editor"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isPreviewMode ? (
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    {previewImage && <img src={previewImage} alt="Featured image preview" className="w-full rounded-lg mb-8" />}
                    <h1>{blogPost.title}</h1>
                    <p className="text-muted-foreground italic">{blogPost.excerpt}</p>
                    <hr />
                    <MarkdownRenderer content={blogPost.content} />
                  </div>
                ) : (
                  <EditorFields post={blogPost} onChange={updateField} slugTaken={slugExists} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <SidebarCards post={blogPost} onChange={updateField} onTagsChange={(tags) => updateField("tags", tags)}>
              <Input value={session?.data?.user?.name || "Admin"} readOnly placeholder="Author name" />
            </SidebarCards>

            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="text-lg font-serif">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {selectedImage ? "Change Featured Image" : "Add Featured Image"}
                </Button>
                {selectedImage && <div className="text-sm text-muted-foreground truncate">Selected: {selectedImage.name}</div>}
                {imagePreviewUrl && (
                  <div className="mt-2">
                    <img src={imagePreviewUrl} alt="Preview" className="w-full rounded-md object-cover" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
