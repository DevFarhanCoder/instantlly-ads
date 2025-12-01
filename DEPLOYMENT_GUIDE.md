# InstantllyAds Dashboard - Complete Setup & Integration Guide

## 🎯 Project Overview

**InstantllyAds** is a Next.js admin dashboard for managing advertisements in the Instantlly Cards mobile app. It allows real-time ad updates without requiring app updates on Google Play Store.

### Key Features:
- ✅ Upload Bottom Ads (624×174px) and Full Screen Ads (624×1000px)
- ✅ Set phone numbers for Call/Message buttons
- ✅ Schedule ads with start/end dates
- ✅ Track impressions and clicks
- ✅ Enable/disable ads instantly
- ✅ Base64 image storage in MongoDB

---

## 📋 What's Been Created

### 1. **Backend (Instantlly-Cards-Backend)**
Created files:
- `/src/models/Ad.ts` - MongoDB schema for ads
- `/src/routes/ads.ts` - API endpoints for ad management

### 2. **Dashboard (instantlly-ads)**
Complete Next.js app with:
- Ad management UI
- Image upload with Base64 conversion
- Date picker for scheduling
- Analytics display
- React Query for data fetching

---

## 🚀 Backend Integration Steps

### Step 1: Add Ads Route to Backend

Open `Instantlly-Cards-Backend/src/index.ts` (or `server.ts`) and add:

```typescript
import adsRoutes from './routes/ads';

// Add this line with other routes
app.use('/api/ads', adsRoutes);
```

### Step 2: Deploy Backend

```bash
cd Instantlly-Cards-Backend
git add .
git commit -m "Add ads management API"
git push

# If using Render, it will auto-deploy
# If manual, run: npm run build && npm start
```

### Step 3: Verify Backend

Test the API:
```bash
# Get active ads
curl https://api.instantllycards.com/api/ads/active

# Should return: {"success":true,"data":[]}
```

---

## 🌐 Deploy Dashboard to Vercel

### Step 1: Push to GitHub

```bash
cd instantlly-ads
git init
git add .
git commit -m "Initial InstantllyAds dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/instantlly-ads.git
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to https://vercel.com
2. Click "Import Project"
3. Select your `instantlly-ads` repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

5. Add Environment Variable:
   ```
   NEXT_PUBLIC_API_BASE = https://api.instantllycards.com
   ```

6. Click "Deploy"

### Step 3: Get Dashboard URL

After deployment, you'll get a URL like:
```
https://instantlly-ads.vercel.app
```

---

## 📱 Mobile App Integration

### Step 1: Update FooterCarousel to Fetch from API

Open `InstantllyCards/components/FooterCarousel.tsx`:

```typescript
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function FooterCarousel() {
  // Fetch bottom ads from API
  const { data: adsData } = useQuery({
    queryKey: ['bottom-ads'],
    queryFn: async () => {
      const response = await api.get('/ads/active?type=bottom');
      return response.data || [];
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    refetchOnMount: true,
  });

  const ads = adsData || [];

  // Track impression when ad is shown
  const trackImpression = async (adId: string) => {
    try {
      await api.post(`/ads/track-impression/${adId}`);
    } catch (error) {
      console.log('Failed to track impression');
    }
  };

  // Track click when user taps ad
  const handleAdClick = async (ad: any) => {
    try {
      await api.post(`/ads/track-click/${ad._id}`);
      // Navigate to chat with phone number
      router.push({
        pathname: `/chat/[userId]`,
        params: {
          userId: ad.phoneNumber,
          name: ad.title,
          preFillMessage: 'I am Interested'
        }
      });
    } catch (error) {
      console.log('Failed to track click');
    }
  };

  return (
    <View>
      {ads.map((ad: any, index: number) => (
        <TouchableOpacity
          key={ad._id}
          onPress={() => handleAdClick(ad)}
          onLayout={() => trackImpression(ad._id)}
        >
          <Image
            source={{ uri: ad.image }} // Base64 image
            style={{ width: 624, height: 174 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Step 2: Update Fullscreen Ads

Similar approach for fullscreen ads - fetch with `?type=fullscreen`

### Step 3: Test in App

1. Run app: `npm start`
2. Ads should load from backend
3. Test impression/click tracking

---

## 🎨 How to Use Dashboard

### 1. Access Dashboard
Navigate to: `https://instantlly-ads.vercel.app`

### 2. Login
Use your Instantlly Cards credentials (same as mobile app)

### 3. Create Bottom Ad
1. Click "Add Bottom Ad"
2. Upload image (624×174px)
3. Enter title
4. Enter phone number (e.g., 919867477227)
5. Set start/end dates
6. Click "Create Ad"

### 4. Create Fullscreen Ad
Same process but select "Fullscreen" and upload 624×1000px image

### 5. View Analytics
- Total ads created
- Active/Inactive count
- Impressions and Clicks
- Click-through rate

### 6. Edit/Delete Ads
- Click "Edit" to modify
- Click "Delete" to remove
- Toggle Active/Inactive status

---

## 🔄 Ad Update Flow

### Old Process (SLOW):
```
Update code → Build AAB → Upload to Play Store → Wait approval → Users update app
⏱️ Time: 1-3 days
```

### New Process (INSTANT):
```
Update ad in dashboard → Changes live immediately
⏱️ Time: 0-5 seconds
```

---

## 📊 Ad Specifications

### Bottom Ads
- **Size:** 624px × 174px
- **Format:** PNG, JPG, WebP
- **Storage:** Base64 in MongoDB
- **Location:** Bottom of home screen
- **Rotation:** 10 seconds each

### Fullscreen Ads
- **Size:** 624px × 1000px
- **Format:** PNG, JPG, WebP
- **Storage:** Base64 in MongoDB
- **Location:** Modal popup
- **Rotation:** 10 seconds each

---

## 🛠️ Troubleshooting

### Dashboard not loading?
```bash
cd instantlly-ads
npm install
npm run dev
```

### API errors?
- Check backend is running: https://api.instantllycards.com/api/ads/active
- Verify environment variable in Vercel

### Ads not showing in app?
1. Check app is fetching from `/api/ads/active`
2. Verify ads have current dates
3. Check `isActive` is true
4. Clear app cache

### Build failed?
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 🔐 Security Notes

1. **Authentication Required** for admin routes (create/edit/delete)
2. **No Authentication** for public routes (active ads, tracking)
3. **Base64 Storage** prevents external image deletion
4. **Date Validation** ensures ads don't show before start or after end

---

## 📝 API Endpoints

### Public (No Auth)
```
GET  /api/ads/active?type=bottom          - Get active bottom ads
GET  /api/ads/active?type=fullscreen      - Get active fullscreen ads
POST /api/ads/track-impression/:id        - Track ad view
POST /api/ads/track-click/:id             - Track ad click
```

### Admin (Auth Required)
```
GET    /api/ads                           - Get all ads
GET    /api/ads/:id                       - Get single ad
POST   /api/ads                           - Create new ad
PUT    /api/ads/:id                       - Update ad
DELETE /api/ads/:id                       - Delete ad
GET    /api/ads/analytics/summary         - Get analytics
```

---

## ✅ Next Steps

1. **Deploy Backend** - Add ads routes and deploy
2. **Deploy Dashboard** - Push to Vercel
3. **Test Dashboard** - Create test ads
4. **Update Mobile App** - Integrate API calls
5. **Test End-to-End** - Verify ads show in app
6. **Monitor Analytics** - Track performance

---

## 📞 Support

Dashboard URL: https://instantlly-ads.vercel.app
Backend API: https://api.instantllycards.com
Mobile App: Instantlly Cards (Play Store)

---

**Status:** ✅ Ready for Deployment
**Last Updated:** November 1, 2025
