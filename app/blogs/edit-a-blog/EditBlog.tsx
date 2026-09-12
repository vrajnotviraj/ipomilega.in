"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PenTool,
  Save,
  Eye,
  ArrowLeft,
  FileText,
  Tags,
  Building2,
  Loader2,
  Image as ImageIcon,
  Type,
  Bold,
  Italic,
  List,
  Quote,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  Clock
} from "lucide-react"
import { toast } from "react-toastify"
import Link from "next/link"
import { Blog } from "@/app/models/ipo"
import { IpoComprehensiveAnalysis } from "@/app/models/ipo_comprehensive_analysis"
import { Ipo } from "@/app/models/ipo"
import { useSession } from "@/lib/auth-client"
import MarkdownRenderer from "@/components/MarkDown"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useProgressRouter } from "@/components/Progressbar/useProgressRouter"

interface IpoandAnalysis {
  ipo: Ipo;
  analysis: IpoComprehensiveAnalysis;
}

interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  status: 'draft' | 'published';
  image_url?: string;
  meta_description: string;
  author: string;
  ipo_id?: string;
  created_at?: string;
  updated_at?: string;
}

export default function EditBlog({ blog }: { blog: Blog }) {
  const params = useParams();
  const router = useProgressRouter();
  const session = useSession();
  const blogId = blog._id || params.id || '';
  const [isAdmin, setIsAdmin] = useState(false)
  const [ipoData, setIpoData] = useState<IpoandAnalysis | null>(null);
  const [isLoadingBlog, setIsLoadingBlog] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [originalBlog, setOriginalBlog] = useState<Blog | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [blogPost, setBlogPost] = useState<BlogPost>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    image_url: '',
    tags: [],
    category: 'IPO Analysis',
    status: 'draft',
    meta_description: '',
    author: 'Admin'
  });

  useEffect(() => {
    const bool = ["admin@gmail.com", "snehshah7634@gmail.com", "shahvraj114@gmail.com", "devanshisoni2004@gmail.com", "devanshisoni2311@gmail.com"].includes(
      session?.data?.user?.email || ""
    );
    setIsAdmin(bool);

  }, [session]);


  // Initialize blog data from props or fetch from API
  useEffect(() => {
    const initializeBlogData = async () => {
      try {
        setIsLoadingBlog(true);
        let blogData = blog;

        // If blog is not provided via props, fetch it
        if (!blog || !blog._id) {
          const response = await fetch(`/api/blogs/${blogId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch blog data');
          }
          const data = await response.json();
          blogData = data.blog;
        }

        setOriginalBlog(blogData);

        // Convert blog data to BlogPost format
        setBlogPost({
          id: blogData._id,
          title: blogData.title || '',
          slug: blogData.slug || '',
          content: blogData.content || '',
          excerpt: blogData.excerpt || '',
          tags: blogData.tags || [],
          category: blogData.category || 'IPO Analysis',
          status: blogData.status as 'draft' | 'published',
          image_url: blogData.image_url,
          meta_description: blogData.meta_description || '',
          author: blogData.author || 'Admin',
          ipo_id: blogData.ipo_id,
          created_at: blogData.created_at,
          updated_at: blogData.updated_at
        });

        // Fetch IPO data if ipo_id exists
        if (blogData.ipo_id) {
          try {
            const [ipoResponse, analysisResponse] = await Promise.all([
              fetch(`/api/ipo/${blogData.ipo_id}`),
              fetch(`/api/analysis/${blogData.ipo_id}`)
            ]);

            if (ipoResponse.ok && analysisResponse.ok) {
              const ipoData = await ipoResponse.json();
              const analysisData = await analysisResponse.json();

              setIpoData({
                ipo: ipoData.ipos,
                analysis: analysisData.ipos_analysis
              });
            }
          } catch (error) {
            console.error('IPO data not available or failed to load', error);
          }
        }
      } catch (error) {
        console.error('Error loading blog data:', error);
        toast.error('Failed to load blog data');
        router.push('/admin');
      } finally {
        setIsLoadingBlog(false);
      }
    };

    initializeBlogData();
    // ❌ Original problematic dependency array: [blog, blogId, router]
    // ✅ By removing the `blog` object from the dependencies, this effect will now only
    //    re-run if the blog's ID changes, preventing the infinite loop.
  }, [blogId]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleInputChange = (field: keyof BlogPost, value: string | string[]) => {
    setBlogPost(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'title' && typeof value === 'string') {
      setBlogPost(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !blogPost.tags.includes(newTag.trim())) {
      setBlogPost(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setBlogPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleUpdate = async (status?: 'draft' | 'published') => {
    try {
      setIsSaving(true);

      // Update blog post
      const payload = {
        ...blogPost,
        status: status || blogPost.status,
        updated_at: new Date().toISOString(),
        tags: blogPost.tags
      };

      const response = await fetch(`/api/blogs/edit-a-blog/${blogPost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update blog post');
      }

      // Upload image if selected
      let imageUrl = blogPost.image_url;
      if (selectedImage && blogPost.id) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('documentId', blogPost.id);
        formData.append('folder', 'blogs');
        formData.append('collection', 'blogs');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadResult = await uploadResponse.json();
        if (uploadResult.success) {
          imageUrl = uploadResult.url;

          // Update blog post with new image URL
          const imageUpdateResponse = await fetch(`/api/blogs/edit-a-blog/${blogPost.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ featured_image: imageUrl, updated_at: new Date().toISOString() }),
          });

          if (!imageUpdateResponse.ok) {
            throw new Error('Failed to update blog post with image URL');
          }

          setBlogPost(prev => ({
            ...prev,
            featured_image: imageUrl
          }));
        }
      }

      const finalStatus = status || blogPost.status;
      if (finalStatus === 'published') {
        toast.success('Blog post updated and published successfully!');
      } else {
        toast.success('Blog post updated successfully!');
      }

      router.push('/admin');

    } catch (error) {
      console.error('Error updating blog post:', error);
      toast.error('Failed to update blog post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/blogs/edit-a-blog/${blogPost.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete blog post');
      }

      toast.success('Blog post deleted successfully!');
      router.push('/admin');

    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast.error('Failed to delete blog post');
    }
  };

  const insertFormatting = (format: string) => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = '';

    switch (format) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        break;
      case 'heading':
        replacement = `## ${selectedText || 'Heading'}`;
        break;
      case 'list':
        replacement = `- ${selectedText || 'List item'}`;
        break;
      case 'quote':
        replacement = `> ${selectedText || 'Quote'}`;
        break;
      case 'link':
        replacement = `[${selectedText || 'Link text'}](url)`;
        break;
    }

    const newContent =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    setBlogPost(prev => ({ ...prev, content: newContent }));
  };
  console.log(isAdmin)


  if (isLoadingBlog) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div className="text-xl font-medium">Loading Blog Post...</div>
            <div className="text-sm text-muted-foreground">Preparing editor</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Header */}
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
                  <h1 className="text-2xl font-semibold font-serif text-foreground">
                    Edit Blog Post
                  </h1>
                  <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
                    {blogPost.title || 'Untitled Post'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdate('draft')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdate('published')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="app-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Blog Info Card */}
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
                      {originalBlog?.created_at ? new Date(originalBlog.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }) : 'Unknown'}
                    </span>
                    <span>•</span>
                    <span>Status: {blogPost.status}</span>
                    <span>•</span>
                    <span>Category: {blogPost.category}</span>
                  </div>
                </div>
              </div>
              <Badge variant={blogPost.status === 'published' ? 'default' : 'secondary'}>
                {blogPost.status}
              </Badge>
            </div>

            {/* IPO Reference Card */}
            {ipoData && (
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={ipoData.ipo.image_url || undefined} alt={ipoData.ipo.upcoming_ipo_2025} />
                        <AvatarFallback>
                          <Building2 className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold font-serif text-lg text-foreground">{ipoData.ipo.upcoming_ipo_2025}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{ipoData.ipo.ipo_type}</span>
                          <span>•</span>
                          <span>{ipoData.ipo.price_band}</span>
                          <span>•</span>
                          <span>{ipoData.ipo.ipo_size}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">Reference IPO</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Blog Editor */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <FileText className="h-5 w-5" />
                  {isPreviewMode ? 'Preview' : 'Blog Editor'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isPreviewMode ? (
                  <>
                    {/* Title */}
                    <div className="space-y-2">
                      <Label htmlFor="title">Blog Title</Label>
                      <Input
                        id="title"
                        value={blogPost.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter blog post title..."
                        className="text-lg font-medium"
                      />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug</Label>
                      <Input
                        id="slug"
                        value={blogPost.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder="url-slug"
                        className="font-mono text-sm"
                      />
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-2">
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        value={blogPost.excerpt}
                        onChange={(e) => handleInputChange('excerpt', e.target.value)}
                        placeholder="Brief description of the blog post..."
                        rows={3}
                      />
                    </div>

                    {/* Content Editor Toolbar */}
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <div className="flex items-center space-x-2 p-2 border rounded-lg bg-muted/20">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertFormatting('bold')}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertFormatting('italic')}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertFormatting('heading')}
                        >
                          <Type className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertFormatting('list')}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertFormatting('quote')}
                        >
                          <Quote className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertFormatting('link')}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <Textarea
                      id="content-textarea"
                      value={blogPost.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="Write your blog content here... (Markdown supported)"
                      rows={20}
                      className="font-mono text-sm resize-none"
                    />
                  </>
                ) : (
                  /* Preview Mode */
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
                      <MarkdownRenderer
                        content={blogPost.content}
                        className="prose-headings:scroll-mt-20"
                      />
                    </article>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Category */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Publishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={blogPost.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IPO Analysis">IPO Analysis</SelectItem>
                      <SelectItem value="Market News">Market News</SelectItem>
                      <SelectItem value="Investment Guide">Investment Guide</SelectItem>
                      <SelectItem value="Company Review">Company Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input
                    value={blogPost.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    placeholder="Author name"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif flex items-center gap-2">
                  <Tags className="h-5 w-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blogPost.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif">SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={blogPost.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    placeholder="SEO meta description..."
                    rows={3}
                  />
                  <div className="text-xs text-muted-foreground">
                    {blogPost.meta_description.length}/160 characters
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-serif">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {selectedImage || blogPost.image_url ? 'Change Featured Image' : 'Add Featured Image'}
                </Button>
                {selectedImage && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {selectedImage.name}
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </Button>
              </CardContent>
            </Card>

            {/* Post Info */}
            {originalBlog && (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg font-serif">Post Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    <strong>Created:</strong> {new Date(originalBlog.created_at || '').toLocaleString()}
                  </div>
                  <div>
                    <strong>Last Updated:</strong> {new Date(originalBlog.updated_at || '').toLocaleString()}
                  </div>
                  {originalBlog.ipo_id && (
                    <div>
                      <strong>IPO ID:</strong> {originalBlog.ipo_id}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}