# InstantllyAds Dashboard

Advertisement Management Dashboard for Instantlly Cards mobile app.

## Features

- ✅ Create/Edit/Delete Ads (Bottom & Full Screen)
- ✅ Upload images (stored as Base64 in MongoDB)
- ✅ Set start/end dates for ad campaigns
- ✅ Configure phone numbers for call/message buttons
- ✅ Toggle ads active/inactive
- ✅ View analytics (impressions & clicks)
- ✅ Real-time updates to mobile app

## Ad Specifications

- **Bottom Ads:** 624px × 174px
- **Full Screen Ads:** 624px × 1000px

## Getting Started

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_BASE=https://instantlly-cards-backend-6ki0.onrender.com`
4. Deploy!

## Backend Setup Required

### 1. Add Ads Route to Backend

In `Instantlly-Cards-Backend/src/index.ts` (or your main server file), add:

```typescript
import adsRouter from './routes/ads';

// Add this line with other routes
app.use('/api/ads', adsRouter);
```

### 2. Restart Backend

```bash
# If using local development
npm run dev

# If deployed on Render
# Just push changes to trigger auto-deploy
```

## Mobile App Integration

The mobile app will automatically fetch ads from the backend API:

- `GET /api/ads/active` - Get all active ads
- `POST /api/ads/track-impression/:id` - Track when ad is shown
- `POST /api/ads/track-click/:id` - Track when user clicks ad

No app update needed when you change ads!

## API Endpoints

### Public (No Auth)
- `GET /api/ads/active` - Get active ads
- `POST /api/ads/track-impression/:id` - Track impression
- `POST /api/ads/track-click/:id` - Track click

### Admin (Requires Auth)
- `GET /api/ads` - Get all ads
- `GET /api/ads/:id` - Get single ad
- `POST /api/ads` - Create new ad
- `PUT /api/ads/:id` - Update ad
- `DELETE /api/ads/:id` - Delete ad
- `GET /api/ads/analytics/summary` - Get analytics

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query (React Query)
- **API Client:** Axios
- **Icons:** Lucide React
- **Date Handling:** date-fns

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_BASE=https://instantlly-cards-backend-6ki0.onrender.com
```

## License

Proprietary - Instantlly Cards
