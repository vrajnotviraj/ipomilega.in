"use client"

import { useState, useRef, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PenTool, Save, Eye, ArrowLeft, Tags, Loader2, Type, Bold, Italic, List, Quote, Link as LinkIcon, Sparkles,
} from "lucide-react"
import Link from "next/link"
import { Blog, Ipo } from "@/types/ipo"

export type BlogFields = Pick<Blog, "title" | "slug" | "content" | "excerpt" | "tags" | "category" | "meta_description">

export const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim()

/** Sets one field; a new title also regenerates the slug. */
export const withField = <T extends BlogFields>(post: T, field: keyof T, value: T[keyof T]): T => ({
  ...post,
  [field]: value,
  ...(field === "title" && { slug: slugify(value as string) }),
})

const CATEGORIES = ["IPO Analysis", "Market News", "Investment Guide", "Company Review"]

const FORMATS = [
  { icon: Bold, wrap: (s: string) => `**${s || "bold text"}**` },
  { icon: Italic, wrap: (s: string) => `*${s || "italic text"}*` },
  { icon: Type, wrap: (s: string) => `## ${s || "Heading"}` },
  { icon: List, wrap: (s: string) => `- ${s || "List item"}` },
  { icon: Quote, wrap: (s: string) => `> ${s || "Quote"}` },
  { icon: LinkIcon, wrap: (s: string) => `[${s || "Link text"}](url)` },
]

export function LoadingScreen({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-xl font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </div>
  )
}

export function EditorHeader({ title, subtitle, isPreviewMode, onTogglePreview, isSaving, onSave }: {
  title: string
  subtitle: ReactNode
  isPreviewMode: boolean
  onTogglePreview: () => void
  isSaving: boolean
  onSave: (status: "draft" | "published") => void
}) {
  const spinner = <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
      <div className="app-container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <PenTool className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold font-serif text-foreground">{title}</h1>
                <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={onTogglePreview}>
              <Eye className="h-4 w-4 mr-2" />
              {isPreviewMode ? "Edit" : "Preview"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSave("draft")} disabled={isSaving}>
              {isSaving ? spinner : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
            <Button size="sm" onClick={() => onSave("published")} disabled={isSaving}>
              {isSaving ? spinner : <Sparkles className="h-4 w-4 mr-2" />}
              Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function IpoSummary({ ipo }: { ipo: Ipo }) {
  return (
    <div>
      <h3 className="font-semibold font-serif text-lg text-foreground">{ipo.upcoming_ipo_2025}</h3>
      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        <span>{ipo.ipo_type}</span>
        <span>•</span>
        <span>{ipo.price_band}</span>
        <span>•</span>
        <span>{ipo.ipo_size}</span>
      </div>
    </div>
  )
}

/** Title, slug, excerpt, markdown toolbar and content textarea. */
export function EditorFields({ post, onChange, slugTaken = false }: {
  post: BlogFields
  onChange: (field: keyof BlogFields, value: string) => void
  slugTaken?: boolean
}) {
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const insertFormatting = (wrap: (selected: string) => string) => {
    const textarea = contentRef.current
    if (!textarea) return
    const { selectionStart: start, selectionEnd: end, value } = textarea
    onChange("content", value.substring(0, start) + wrap(value.substring(start, end)) + value.substring(end))
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Blog Title</Label>
        <Input
          id="title"
          value={post.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Enter blog post title..."
          className="text-lg font-medium"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL Slug</Label>
        <Input
          id="slug"
          value={post.slug}
          onChange={(e) => onChange("slug", e.target.value)}
          placeholder="url-slug"
          className="font-mono text-sm"
        />
      </div>
      {slugTaken && (
        <div>
          <p className="text-destructive">Slug already exists</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          value={post.excerpt}
          onChange={(e) => onChange("excerpt", e.target.value)}
          placeholder="Brief description of the blog post..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <div className="flex items-center space-x-2 p-2 border rounded-lg bg-muted/20">
          {FORMATS.map(({ icon: Icon, wrap }, i) => (
            <Button key={i} type="button" variant="ghost" size="sm" onClick={() => insertFormatting(wrap)}>
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      <Textarea
        id="content-textarea"
        ref={contentRef}
        value={post.content}
        onChange={(e) => onChange("content", e.target.value)}
        placeholder="Write your blog content here... (Markdown supported)"
        rows={20}
        className="font-mono text-sm resize-none"
      />
    </>
  )
}

/** Category select, author field (passed as children), tags and SEO cards. */
export function SidebarCards({ post, onChange, onTagsChange, children }: {
  post: BlogFields
  onChange: (field: "category" | "meta_description", value: string) => void
  onTagsChange: (tags: string[]) => void
  children: ReactNode
}) {
  const [newTag, setNewTag] = useState("")

  const addTag = () => {
    const tag = newTag.trim()
    if (!tag || post.tags.includes(tag)) return
    onTagsChange([...post.tags, tag])
    setNewTag("")
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg font-serif">Publishing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={post.category} onValueChange={(value) => onChange("category", value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            {children}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg font-serif flex items-center gap-2"><Tags className="h-5 w-5" />Tags</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <Button size="sm" onClick={addTag}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onTagsChange(post.tags.filter((t) => t !== tag))}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg font-serif">SEO Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea
              value={post.meta_description}
              onChange={(e) => onChange("meta_description", e.target.value)}
              placeholder="SEO meta description..."
              rows={3}
            />
            <div className="text-xs text-muted-foreground">{post.meta_description.length}/160 characters</div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
