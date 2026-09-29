"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Building2, Image as ImageIcon, Trash2, Clock } from "lucide-react"
import { toast } from "react-toastify"
import { Blog, Ipo } from "@/types/ipo"
import MarkdownRenderer from "@/components/blog/MarkDown"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProgressRouter } from "@/hooks/useProgressRouter"
import { type BlogFields, withField, LoadingScreen, EditorHeader, IpoSummary, EditorFields, SidebarCards } from "@/components/blog/BlogEditor"


type Status = "draft" | "published"
type EditablePost = BlogFields & Pick<Blog, "author"> & Partial<Pick<Blog, "image_url" | "ipo_id" | "created_at" | "updated_at">> & {
  id?: string
  status: Status
}

const toEditablePost = (blog: Blog): EditablePost => ({
  id: blog._id,
  title: blog.title || "",
  slug: blog.slug || "",
  content: blog.content || "",
  excerpt: blog.excerpt || "",
  tags: blog.tags || [],
  category: blog.category || "IPO Analysis",
  status: blog.status as Status,
  image_url: blog.image_url,
  meta_description: blog.meta_description || "",
  author: blog.author || "Admin",
  ipo_id: blog.ipo_id,
  created_at: blog.created_at,
  updated_at: blog.updated_at,
})

const jsonPut = (url: string, body: object) =>
  fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

export default function EditBlog({ blog }: { blog: Blog }) {
  const params = useParams()
  const router = useProgressRouter()
  const blogId = blog._id || params.id || ""
  const [ipo, setIpo] = useState<Ipo | null>(null)
  const [isLoadingBlog, setIsLoadingBlog] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [originalBlog, setOriginalBlog] = useState<Blog | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [blogPost, setBlogPost] = useState<EditablePost>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    image_url: "",
    tags: [],
    category: "IPO Analysis",
    status: "draft",
    meta_description: "",
    author: "Admin",
  })

  useEffect(() => {
    const loadBlog = async () => {
      try {
        setIsLoadingBlog(true)
        if (!blog?._id) throw new Error("Failed to fetch blog data")

        setOriginalBlog(blog)
        setBlogPost(toEditablePost(blog))

        if (!blog.ipo_id) return
        try {
          const [ipoResponse, analysisResponse] = await Promise.all([
            fetch(`/api/ipo/${blog.ipo_id}`),
            fetch(`/api/analysis/${blog.ipo_id}`),
          ])
          if (ipoResponse.ok && analysisResponse.ok) setIpo((await ipoResponse.json()).ipos)
        } catch (error) {
          console.error("IPO data not available or failed to load", error)
        }
      } catch (error) {
        console.error("Error loading blog data:", error)
        toast.error("Failed to load blog data")
        router.push("/admin")
      } finally {
        setIsLoadingBlog(false)
      }
    }

    loadBlog()
    // Keyed on blogId only: `blog` and `router` are new objects each render and would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogId])

  const updateField = (field: keyof EditablePost, value: EditablePost[keyof EditablePost]) =>
    setBlogPost((prev) => withField(prev, field, value))

  const handleUpdate = async (status?: Status) => {
    const finalStatus = status || blogPost.status
    try {
      setIsSaving(true)
      const blogUrl = `/api/blogs/edit-a-blog/${blogPost.id}`

      const response = await jsonPut(blogUrl, { ...blogPost, status: finalStatus, updated_at: new Date().toISOString() })
      if (!response.ok) throw new Error("Failed to update blog post")

      if (selectedImage && blogPost.id) {
        const formData = new FormData()
        formData.append("file", selectedImage)
        formData.append("documentId", blogPost.id)
        formData.append("folder", "blogs")
        formData.append("collection", "blogs")

        const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData })
        if (!uploadResponse.ok) throw new Error("Failed to upload image")

        const uploadResult = await uploadResponse.json()
        if (uploadResult.success) {
          const imageResponse = await jsonPut(blogUrl, { featured_image: uploadResult.url, updated_at: new Date().toISOString() })
          if (!imageResponse.ok) throw new Error("Failed to update blog post with image URL")
        }
      }

      toast.success(finalStatus === "published" ? "Blog post updated and published successfully!" : "Blog post updated successfully!")
      router.push("/admin")
    } catch (error) {
      console.error("Error updating blog post:", error)
      toast.error("Failed to update blog post")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) return
    try {
      const response = await fetch(`/api/blogs/edit-a-blog/${blogPost.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete blog post")
      toast.success("Blog post deleted successfully!")
      router.push("/admin")
    } catch (error) {
      console.error("Error deleting blog post:", error)
      toast.error("Failed to delete blog post")
    }
  }

  if (isLoadingBlog) return <LoadingScreen title="Loading Blog Post..." subtitle="Preparing editor" />

  return (
    <div className="min-h-screen bg-background pt-16">
      <EditorHeader
        title="Edit Blog Post"
        subtitle={blogPost.title || "Untitled Post"}
        isPreviewMode={isPreviewMode}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        isSaving={isSaving}
        onSave={handleUpdate}
      />

      <div className="app-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold font-serif text-lg text-foreground">Blog Post Details</h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {originalBlog?.created_at
                        ? new Date(originalBlog.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                        : "Unknown"}
                    </span>
                    <span>•</span>
                    <span>Status: {blogPost.status}</span>
                    <span>•</span>
                    <span>Category: {blogPost.category}</span>
                  </div>
                </div>
              </div>
              <Badge variant={blogPost.status === "published" ? "default" : "secondary"}>{blogPost.status}</Badge>
            </div>

            {ipo && (
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={ipo.image_url || undefined} alt={ipo.upcoming_ipo_2025} />
                        <AvatarFallback>
                          <Building2 className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
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
                  <div className="prose prose-lg max-w-none">
                    {blogPost.image_url && (
                      <Avatar>
                        <AvatarImage src={blogPost.image_url} alt="Featured image" />
                        <AvatarFallback>IP</AvatarFallback>
                      </Avatar>
                    )}
                    <h1>{blogPost.title}</h1>
                    <p className="text-muted-foreground italic">{blogPost.excerpt}</p>
                    <article className="mb-12">
                      <MarkdownRenderer content={blogPost.content} className="prose-headings:scroll-mt-20" />
                    </article>
                  </div>
                ) : (
                  <EditorFields post={blogPost} onChange={updateField} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <SidebarCards post={blogPost} onChange={updateField} onTagsChange={(tags) => updateField("tags", tags)}>
              <Input
                value={blogPost.author}
                onChange={(e) => updateField("author", e.target.value)}
                placeholder="Author name"
              />
            </SidebarCards>

            <Card className="border-border bg-card">
              <CardHeader><CardTitle className="text-lg font-serif">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && setSelectedImage(e.target.files[0])}
                />
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {selectedImage || blogPost.image_url ? "Change Featured Image" : "Add Featured Image"}
                </Button>
                {selectedImage && <div className="text-sm text-muted-foreground">Selected: {selectedImage.name}</div>}
                <Button variant="destructive" size="sm" className="w-full justify-start" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </Button>
              </CardContent>
            </Card>

            {originalBlog && (
              <Card className="border-border bg-card">
                <CardHeader><CardTitle className="text-lg font-serif">Post Information</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div><strong>Created:</strong> {new Date(originalBlog.created_at || "").toLocaleString()}</div>
                  <div><strong>Last Updated:</strong> {new Date(originalBlog.updated_at || "").toLocaleString()}</div>
                  {originalBlog.ipo_id && <div><strong>IPO ID:</strong> {originalBlog.ipo_id}</div>}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
