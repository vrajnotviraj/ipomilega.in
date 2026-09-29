# Ipo Milega V1


**IPO Milega** is a modern, high-performance web platform for tracking, analyzing, and managing Indian Initial Public Offerings (IPOs). Built with **Next.js 15 (App Router)**, **TypeScript**, **MongoDB**, and **Tailwind CSS**, it delivers comprehensive IPO insights, financial performance charts, and direct admin management.

---

## ✨ Features

- 📊 **Live, Upcoming & Past IPO Dashboard**: Filterable and searchable views for active subscriptions, upcoming listings, and historical IPO performances.
- 🎯 **Comprehensive IPO Analysis**: Deep-dive analytics covering Overall Score, Profitability Assessment, Financial Fundamentals, Risk Meter, Business Flexibility, and Management Quality.
- ✏️ **Direct Inline Admin Editing**: Admins can double-click any field (metrics, descriptions, scores) on the analysis page for seamless, real-time in-place editing.
- 📈 **Interactive Financial & Allocation Charts**: Visual breakdown of investor quota allocations (Retail, QIB, NII) and multi-year financial performance trends using Recharts.
- 🤖 **AI Prospectus Parser**: Automated AI tool for parsing DRHP/RHP documents and populating comprehensive IPO analytics.
- 🔐 **Authentication & Role Control**: Secure authentication integrated via Better Auth with Google social login and role-based admin access.
- ⚡ **SEO & Performance Optimized**: Built with Next.js Server Components, JSON-LD structured data, metadata optimization, and MongoDB connection caching.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, TypeScript)
- **Styling**: Tailwind CSS, CSS Modules, Lucide Icons, Radix UI
- **Database**: MongoDB with Mongoose (cached connections)
- **Authentication**: Better Auth (Google OAuth & Credentials)
- **Data Visualization**: Recharts (Interactive Bar & Pie Charts)
- **Toast Notifications**: Sonner

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.x or higher)
- MongoDB instance (Local or MongoDB Atlas)

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ipomilega

# App & Auth Configurations
NEXTAUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your_auth_secret_key

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
├── app/                      # Routes only (pages, layouts, API routes, OG images)
│   ├── admin/                # Admin dashboard
│   ├── analysis/             # Analysis list and [id] detail pages
│   ├── api/                  # API routes (IPO, analysis, blogs, auth)
│   ├── blogs/                # Blog list, detail, create and edit pages
│   ├── ipos/                 # All IPOs list
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── admin/                # Admin modal and status widgets
│   ├── blog/                 # Markdown renderer
│   ├── charts/               # Recharts components
│   ├── home/                 # Home page sections
│   ├── ipo/                  # IPO pieces shared across pages
│   ├── layout/               # Site chrome, footer, logo
│   ├── progress/             # Route progress bar
│   └── ui/                   # shadcn primitives
├── hooks/                    # Standalone React hooks
├── lib/                      # Server, data and formatting helpers
├── types/                    # Data models and shared types
├── scripts/                  # One-off maintenance scripts
└── public/                   # Static assets
```

---

## 📜 Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launches local development server |
| `npm run build` | Compiles production build |
| `npm run start` | Starts production server |
| `npm run lint` | Runs ESLint code quality checks |

---

## 🔒 Admin Access

Users logged in with administrative email credentials automatically receive direct inline edit privileges, allowing real-time modification of IPO data, timeline milestones, and evaluation scores directly on the site.
