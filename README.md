# Insight Hub - Next.js 16 Migration

A portfolio/blog platform migrated to Next.js 16 with React Server Components, On-Demand Revalidation, and tag-based caching.

## Features

- **Next.js 16 App Router**: Full migration to the app directory with RSC architecture
- **On-Demand Revalidation**: API route for manual cache invalidation using tags
- **Tag-Based Caching**: Efficient data fetching with `unstable_cache` and `revalidateTag`
- **Dynamic Routes**: Static generation with `generateStaticParams` and async params
- **Supabase Integration**: Backend for data, authentication, and real-time features
- **shadcn/ui Components**: Beautiful, accessible UI components based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom animations
- **TypeScript**: Full type safety across the codebase

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── revalidate/route.ts    # On-Demand Revalidation API
│   ├── case-study/page.tsx         # Case Studies page
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout with auth
│   ├── page.tsx                    # Main dashboard (RSC)
│   ├── sign-in/page.tsx            # Sign-in page
│   ├── sign-up/page.tsx            # Sign-up page
│   └── topics/
│       ├── [id]/page.tsx           # Topic detail with generateStaticParams
│       └── create/page.tsx         # Topic creation page
├── components/
│   ├── common/
│   │   ├── AppHeader.tsx           # Global navigation
│   │   ├── AppFooter.tsx           # Footer component
│   │   └── index.ts
│   ├── topics/
│   │   ├── TopicCard.tsx           # Topic card component
│   │   └── index.ts
│   └── ui/                         # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── select.tsx
│       └── index.ts
├── constants/
│   ├── category.constant.ts        # Category options
│   ├── querykey.constant.ts        # Query keys
│   └── sort.constant.ts            # Sort options
├── lib/
│   ├── supabase.ts                 # Supabase client setup
│   └── utils.ts                    # Utility functions
├── services/
│   ├── authService.ts              # Authentication service
│   ├── topicService.ts             # Topic CRUD with caching
│   └── useService.ts               # User service
└── types/
    ├── auth.type.ts                # Auth types
    └── topic.type.ts               # Topic types
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (copy `.env.example` to `.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
REVALIDATION_SECRET=your_revalidation_secret
```

4. Run the development server:
```bash
npm run dev
```

## Key Next.js 16 Features Used

### On-Demand Revalidation
The `/api/revalidate` route allows manual cache invalidation:
```typescript
POST /api/revalidate
Headers: Authorization: Bearer <REVALIDATION_SECRET>
Body: { "tag": "posts" }
```

### Tag-Based Caching
Data fetching uses tags for selective revalidation:
```typescript
const { topics } = await unstable_cache(
  async () => fetchTopics(...),
  ['posts'],
  { tags: ['posts'] }
)();
```

### Dynamic Routes with Async Params
Topic detail page uses Next.js 16's async params pattern:
```typescript
export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // ...
}
```

### Static Generation
`generateStaticParams` pre-builds routes at build time:
```typescript
export async function generateStaticParams() {
  const topicIds = await getAllTopicIds();
  return topicIds.map((id) => ({ id }));
}
```

## UI Components

The project uses shadcn/ui components built on Radix UI:
- Button, Card, Input, Select, Dialog, DropdownMenu
- Custom animations (fade-in-up)
- Dark theme with indigo accent colors

## Authentication

Supabase Auth is used for:
- Email/password sign-in and sign-up
- Session management
- Protected routes

## License

MIT
