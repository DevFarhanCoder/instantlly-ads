'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2, Edit, Calendar, LogOut, LayoutGrid, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';

interface Ad {
  _id: string;
  title: string;
  adType?: 'image' | 'video';
  bottomImage?: string; // Now optional (excluded from list query)
  fullscreenImage?: string; // Now optional (excluded from list query)
  bottomImageGridFS?: string; // GridFS reference
  fullscreenImageGridFS?: string; // GridFS reference
  bottomVideoId?: string;
  fullscreenVideoId?: string;
  hasBottomVideo?: boolean;
  hasFullscreenVideo?: boolean;
  phoneNumber: string;
  startDate: string;
  endDate: string;
  priority: number;
  impressions: number;
  clicks: number;
  createdAt: string;
}

// Helper to construct image URL
const getImageUrl = (adId: string, type: 'bottom' | 'fullscreen') => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.instantllycards.com';
  return `${baseUrl}/api/ads/image/${adId}/${type}`;
};

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'scheduled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [videoModal, setVideoModal] = useState<{ show: boolean; url: string; title: string }>({ show: false, url: '', title: '' });
  const adsPerPage = 20;
  const queryClient = useQueryClient();
  const router = useRouter();

  // Validate token on mount - but only check existence, let API calls handle validation
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    router.push('/login');
  };

  // Fetch all ads
  const { data: adsData, isLoading, error, isError } = useQuery({
    queryKey: ['ads'],
    queryFn: async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🌐 [FRONTEND] Starting API request to fetch ads');
      console.log('🕐 Time:', new Date().toISOString());
      console.log('🔗 URL:', api.defaults.baseURL + '/admin/ads/all');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const startTime = Date.now();

      try {
        console.log('📤 Sending GET request to backend...');
        const response = await api.get('/admin/ads/all');
        const requestTime = Date.now() - startTime;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ [FRONTEND] Response received!');
        console.log('⏱️  Request time:', requestTime, 'ms');
        console.log('📊 Status:', response.status);
        console.log('📦 Data received:', response.data?.ads?.length || 0, 'ads');
        console.log('🐛 Debug info:', response.data);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return response.data.ads || [];
      } catch (err: any) {
        const requestTime = Date.now() - startTime;

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ [FRONTEND] Request failed!');
        console.error('⏱️  Time elapsed:', requestTime, 'ms');
        console.error('🔴 Error type:', err.code || err.name);
        console.error('💬 Error message:', err.message);
        console.error('📊 Response status:', err.response?.status);
        console.error('📦 Response data:', err.response?.data);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        throw err;
      }
    },
    retry: 2, // Retry failed requests twice
    retryDelay: 1000, // Wait 1s between retries
    staleTime: 30000, // Consider data fresh for 30s
  });

  // Fetch analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await api.get('/ads/analytics/summary');
      return response.data.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/ads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });

  const handleEdit = async (ad: Ad) => {
    console.log('📝 [FRONTEND] Fetching complete ad data for editing:', ad._id);

    try {
      // Fetch complete ad data
      const response = await api.get(`/ads/${ad._id}`);
      const completeAd = response.data.data;

      console.log('✅ [FRONTEND] Complete ad data fetched');
      console.log('   bottomImage length:', completeAd.bottomImage?.length || 0);
      console.log('   fullscreenImage length:', completeAd.fullscreenImage?.length || 0);
      console.log('   bottomImageGridFS:', completeAd.bottomImageGridFS || 'none');
      console.log('   fullscreenImageGridFS:', completeAd.fullscreenImageGridFS || 'none');

      // If images are in GridFS (empty bottomImage/fullscreenImage strings), 
      // use the image endpoint URLs instead
      if ((!completeAd.bottomImage || completeAd.bottomImage.length < 100) && completeAd.bottomImageGridFS) {
        console.log('🔄 [FRONTEND] Bottom image in GridFS - using endpoint URL');
        completeAd.bottomImage = getImageUrl(ad._id, 'bottom');
      }

      if ((!completeAd.fullscreenImage || completeAd.fullscreenImage.length < 100) && completeAd.fullscreenImageGridFS) {
        console.log('🔄 [FRONTEND] Fullscreen image in GridFS - using endpoint URL');
        completeAd.fullscreenImage = getImageUrl(ad._id, 'fullscreen');
      }

      console.log('✅ [FRONTEND] Images ready for edit form');
      console.log('   Has bottomImage:', !!completeAd.bottomImage);
      console.log('   Has fullscreenImage:', !!completeAd.fullscreenImage);

      setEditingAd(completeAd);
      setShowModal(true);
    } catch (error) {
      console.error('❌ [FRONTEND] Failed to fetch ad details:', error);
      alert('Failed to load ad details. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      deleteMutation.mutate(id);
    }
  };

  // Check if ad is currently active based on date range
  const isAdActive = (ad: Ad) => {
    const now = new Date();
    const start = new Date(ad.startDate);
    const end = new Date(ad.endDate);
    return now >= start && now <= end;
  };

  // Check if ad is expired
  const isAdExpired = (ad: Ad) => {
    const now = new Date();
    const end = new Date(ad.endDate);
    return now > end;
  };

  // Check if ad is scheduled (not started yet)
  const isAdScheduled = (ad: Ad) => {
    const now = new Date();
    const start = new Date(ad.startDate);
    return now < start;
  };

  // Get ad status for display
  const getAdStatus = (ad: Ad) => {
    if (isAdActive(ad)) {
      return { label: '✓ Active', color: 'bg-green-100 text-green-800' };
    } else if (isAdExpired(ad)) {
      return { label: '⏰ Expired', color: 'bg-red-100 text-red-800' };
    } else {
      return { label: '⏸ Scheduled', color: 'bg-gray-100 text-gray-600' };
    }
  };

  // Filter ads based on search query and status
  const filteredAds = adsData?.filter((ad: Ad) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = ad.title.toLowerCase().includes(query) || ad.phoneNumber.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return isAdActive(ad);
    if (statusFilter === 'expired') return isAdExpired(ad);
    if (statusFilter === 'scheduled') return isAdScheduled(ad);

    return true;
  }) || [];

  console.log('📊 Dashboard State:', {
    adsData: adsData?.length || 0,
    filteredAds: filteredAds.length,
    isLoading,
    isError,
    error: error?.message
  });

  // Pagination
  const totalPages = Math.ceil(filteredAds.length / adsPerPage);
  const startIndex = (currentPage - 1) * adsPerPage;
  const endIndex = startIndex + adsPerPage;
  const paginatedAds = filteredAds.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src="/Instantlly Logo.jpg" alt="Instantlly Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">InstantllyAds</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Advertisement Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/pending-ads"
                className="bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 hover:bg-yellow-700 transition flex-1 sm:flex-initial justify-center"
              >
                <AlertCircle size={18} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Pending Ads</span>
              </Link>
              <button
                onClick={() => {
                  setEditingAd(null);
                  setShowModal(true);
                }}
                className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 hover:bg-blue-700 transition flex-1 sm:flex-initial justify-center"
              >
                <PlusCircle size={18} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Create Ad</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 hover:bg-red-700 transition"
              >
                <LogOut size={18} className="sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Ads</p>
                  <p className="text-3xl font-bold text-gray-900">{analyticsData.totalAds}</p>
                </div>
                <LayoutGrid className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Currently Active</p>
                  <p className="text-3xl font-bold text-green-600">{analyticsData.activeAds}</p>
                  <p className="text-xs text-gray-400 mt-1">Live right now</p>
                </div>
                <Calendar className="text-green-600" size={32} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Expired Ads</p>
                  <p className="text-3xl font-bold text-orange-600">{analyticsData.expiredAds}</p>
                  <p className="text-xs text-gray-400 mt-1">Past end date</p>
                </div>
                <Calendar className="text-orange-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Ads List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900">All Advertisements</h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'expired' | 'scheduled')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="scheduled">Scheduled</option>
                </select>
                <input
                  type="text"
                  placeholder="Search by title or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 sm:min-w-[300px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-900 font-medium">Loading ads...</p>
                <p className="text-sm text-gray-500 mt-2">This may take up to 90 seconds if the server was sleeping...</p>
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Ads</h3>
                  <p className="text-sm text-red-700 mb-4">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                  </p>

                  {/* Debug Information */}
                  <div className="bg-red-100 border border-red-300 rounded p-4 mb-4 text-left">
                    <p className="text-xs font-semibold text-red-900 mb-2">🐛 Debug Information:</p>
                    <div className="space-y-1 text-xs text-red-800 font-mono">
                      <p>🌐 Frontend: Connected to browser ✅</p>
                      <p>🔗 API URL: {api.defaults.baseURL}/ads</p>
                      <p>⏰ Time: {new Date().toLocaleTimeString()}</p>
                      <p>📱 Check browser console for detailed logs</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-left text-xs text-red-600 bg-red-100 p-3 rounded mb-4">
                    <p><strong>Possible reasons:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>🟡 Render free tier sleeping (50-90 seconds wake time)</li>
                      <li>🔴 MongoDB Atlas connection timeout</li>
                      <li>🔴 Network connectivity issues</li>
                      <li>🔴 Render.com IP blocked by MongoDB firewall</li>
                    </ul>
                    <p className="mt-2"><strong>💡 Check Render logs for backend errors</strong></p>
                  </div>
                  <button
                    onClick={() => {
                      console.log('🔄 [FRONTEND] User clicked retry button');
                      queryClient.invalidateQueries({ queryKey: ['ads'] });
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : adsData && adsData.length > 0 ? (
              filteredAds.length > 0 ? (
                <table className="w-full min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr.</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Schedule</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-2 sm:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedAds.map((ad: Ad, index: number) => {
                      const status = getAdStatus(ad);
                      const globalIndex = startIndex + index + 1;
                      return (
                        <tr key={ad._id} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900">{globalIndex}</td>
                          <td className="px-2 sm:px-4 lg:px-6 py-4">
                            <div className="flex flex-col space-y-2">
                              {/* Check if it's a video ad */}
                              {ad.adType === 'video' ? (
                                <>
                                  {ad.hasBottomVideo && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-1">Bottom Video</p>
                                      <div
                                        className="relative w-44 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded overflow-hidden cursor-pointer group border border-gray-200"
                                        onClick={() => setVideoModal({
                                          show: true,
                                          url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/channel-partner/ads/video/${ad.bottomVideoId}`,
                                          title: `${ad.title} - Bottom Video`
                                        })}
                                      >
                                        <video
                                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/channel-partner/ads/video/${ad.bottomVideoId}#t=0.5`}
                                          className="h-full w-full object-cover pointer-events-none"
                                          preload="metadata"
                                          muted
                                          playsInline
                                          onLoadedData={(e) => {
                                            const video = e.target as HTMLVideoElement;
                                            video.currentTime = 0.5;
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center group-hover:from-black/70 group-hover:via-black/40 transition-all">
                                          <div className="bg-white/90 rounded-full p-1.5 group-hover:bg-white group-hover:scale-110 transition-all">
                                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {ad.hasFullscreenVideo && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-1">Full Video</p>
                                      <div
                                        className="relative w-12 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded overflow-hidden cursor-pointer group border border-gray-200"
                                        onClick={() => setVideoModal({
                                          show: true,
                                          url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/channel-partner/ads/video/${ad.fullscreenVideoId}`,
                                          title: `${ad.title} - Full Video`
                                        })}
                                      >
                                        <video
                                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/channel-partner/ads/video/${ad.fullscreenVideoId}#t=0.5`}
                                          className="h-full w-full object-cover pointer-events-none"
                                          preload="metadata"
                                          muted
                                          playsInline
                                          onLoadedData={(e) => {
                                            const video = e.target as HTMLVideoElement;
                                            video.currentTime = 0.5;
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent flex items-center justify-center group-hover:from-black/70 group-hover:via-black/40 transition-all">
                                          <div className="bg-white/90 rounded-full p-1.5 group-hover:bg-white group-hover:scale-110 transition-all">
                                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">Bottom</p>
                                    <img
                                      src={getImageUrl(ad._id, 'bottom')}
                                      alt={`${ad.title} - Bottom`}
                                      className="h-10 sm:h-12 w-auto object-cover rounded border"
                                    />
                                  </div>
                                  {(ad.fullscreenImage || ad.fullscreenImageGridFS) && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 mb-1">Full</p>
                                      <img
                                        src={getImageUrl(ad._id, 'fullscreen')}
                                        alt={`${ad.title} - Fullscreen`}
                                        className="h-10 sm:h-12 w-auto object-cover rounded border"
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{ad.title}</div>
                            {ad.adType === 'video' ? (
                              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                Video Ad
                              </span>
                            ) : (ad.fullscreenImage || ad.fullscreenImageGridFS) ? (
                              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                With Fullscreen
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                Banner Only
                              </span>
                            )}
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">{ad.phoneNumber}</td>
                          <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                            <div className="flex flex-col space-y-1 text-xs text-gray-500">
                              <span>📅 {format(new Date(ad.startDate), 'MMM dd, yyyy')}</span>
                              <span>📅 {format(new Date(ad.endDate), 'MMM dd, yyyy')}</span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-1 sm:space-x-2">
                              <button
                                onClick={() => handleEdit(ad)}
                                className="text-blue-600 hover:text-blue-900 p-1.5 sm:p-2 hover:bg-blue-50 rounded"
                                title="Edit ad"
                              >
                                <Edit size={16} className="sm:w-[18px] sm:h-[18px]" />
                              </button>
                              <button
                                onClick={() => handleDelete(ad._id)}
                                className="text-red-600 hover:text-red-900 p-1.5 sm:p-2 hover:bg-red-50 rounded"
                                title="Delete ad"
                              >
                                <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No ads match your search. Try a different search term.
                </div>
              )
            ) : (
              <div className="p-8 text-center text-gray-500">
                No ads found. Create your first ad to get started!
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredAds.length > 0 && totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAds.length)} of {filteredAds.length} ads
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <AdModal
          ad={editingAd}
          onClose={() => {
            setShowModal(false);
            setEditingAd(null);
          }}
        />
      )}
    </div>
  );
}

// Ad Modal Component
function AdModal({ ad, onClose }: { ad: Ad | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: ad?.title || '',
    // mediaType: 'image' as 'image' | 'video',
    bottomImage: ad?.bottomImage || '',
    fullscreenImage: ad?.fullscreenImage || '',
    phoneNumber: ad?.phoneNumber || '',
    startDate: ad ? format(new Date(ad.startDate), 'yyyy-MM-dd') : '',
    endDate: ad ? format(new Date(ad.endDate), 'yyyy-MM-dd') : '',
    priority: ad?.priority || 5,
    bottomMediaType: 'image' as 'image' | 'video',
    fullscreenMediaType: 'image' as 'image' | 'video',
    bottomFile: null as File | null,
    fullscreenFile: null as File | null,
  });
  const [bottomPreview, setBottomPreview] = useState<string | null>(null);
  const [fullscreenPreview, setFullscreenPreview] = useState<string | null>(null);

  useEffect(() => {
    if (ad) {
      setFormData(prev => ({
        ...prev,
        bottomMediaType: ad.adType === 'video' ? 'video' : 'image',
        fullscreenMediaType: ad.adType === 'video' ? 'video' : 'image',
      }));
    }
  }, [ad]);


  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        if (ad) {
          await api.put(`/ads/${ad._id}`, buildFormData(), {
            onUploadProgress: (progressEvent) => {
              const percentCompleted = progressEvent.total
                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                : 0;
              setUploadProgress(percentCompleted);
            },
          });
        } else {
          await api.post('/ads', buildFormData(), {
            onUploadProgress: (progressEvent) => {
              const percentCompleted = progressEvent.total
                ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                : 0;
              setUploadProgress(percentCompleted);
            },
          });
        }
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      alert('✅ Advertisement ' + (ad ? 'updated' : 'created') + ' successfully!');
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to save ad:', error);
      alert('❌ Failed to ' + (ad ? 'update' : 'create') + ' advertisement. Please try again.\n\nError: ' + (error.response?.data?.message || error.message));
    },
  });

  const handleBottomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(p => ({ ...p, bottomFile: file }));
      setBottomPreview(URL.createObjectURL(file))
    }
  };

  const handleFullscreenImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(p => ({ ...p, fullscreenFile: file }));
      setFullscreenPreview(URL.createObjectURL(file))
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const buildFormData = () => {
    const fd = new FormData();

    fd.append('title', formData.title);
    fd.append('phoneNumber', formData.phoneNumber);
    fd.append('startDate', formData.startDate);
    fd.append('endDate', formData.endDate);
    fd.append('priority', String(formData.priority));

    fd.append('bottomMediaType', formData.bottomMediaType);
    fd.append('fullscreenMediaType', formData.fullscreenMediaType);

    if (formData.bottomFile) {
      fd.append(
        formData.bottomMediaType === 'image' ? 'bottomImage' : 'bottomVideo',
        formData.bottomFile
      );
    }

    if (formData.fullscreenFile) {
      fd.append(
        formData.fullscreenMediaType === 'image'
          ? 'fullscreenImage'
          : 'fullscreenVideo',
        formData.fullscreenFile
      );
    }

    return fd;
  };


  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">⊕</span>
              {ad ? 'Edit Advertisement' : 'Create New Advertisement'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ✕ Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Advertisement Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Summer Sale 2024"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🖼️ Media Type <span className="text-red-500">*</span>
              </label>
              <div className="flex w-full rounded-lg overflow-hidden">
                <button
                  type="button"
                  className={`flex-1 px-4 py-3 font-semibold transition flex items-center justify-center gap-2 ${formData.bottomMediaType === 'image'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      bottomMediaType: 'image',
                      fullscreenMediaType: 'image',
                      bottomFile: null,
                      fullscreenFile: null,
                    }))
                  }}
                >
                  🖼️ Image
                </button>
                <button
                  type="button"
                  className={`flex-1 px-4 py-3 font-semibold transition flex items-center justify-center gap-2 ${formData.bottomMediaType === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 border-l-0'
                    }`}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      bottomMediaType: 'video',
                      fullscreenMediaType: 'video',
                      bottomFile: null,
                      fullscreenFile: null,
                    }))
                  }}
                >
                  🎬 Video
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select whether your advertisement is an image or video
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📞 Contact Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+919876543210"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-700 text-gray-900"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Users will see Call/Message buttons with this number
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  style={{ colorScheme: 'light' }}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Your ad will start on this date</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  style={{ colorScheme: 'light' }}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Your ad will end on this date</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🖼️ Bottom Banner {formData.bottomMediaType === 'image' ? 'Image' : 'Video'} <span className="text-red-500">* (624 × 174px)</span>
                </label>
                <input
                  type="file"
                  accept={formData.bottomMediaType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleBottomImageUpload}
                  className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700 file:cursor-pointer
                  border border-gray-300 rounded-lg
                  cursor-pointer focus:outline-none"
                  required={!ad}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This appears in the bottom carousel • {formData.bottomMediaType === 'image' ? 'Image' : 'Video'} only
                </p>
                {bottomPreview && (
                  <div className="mt-2">
                    {formData.bottomMediaType === 'image' ? (
                      <img src={bottomPreview} alt="Bottom Preview" className="h-20 rounded border shadow-sm object-cover" />
                    ) : (
                      <video src={bottomPreview} controls className="h-20 rounded border shadow-sm" />
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🖼️ Fullscreen {formData.fullscreenMediaType === 'image' ? 'Image' : 'Video'} (Optional) (624 × 1000px)
                </label>
                <input
                  type="file"
                  accept={formData.fullscreenMediaType === 'image' ? 'image/*' : 'video/*'}
                  onChange={handleFullscreenImageUpload}
                  className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700 file:cursor-pointer
                  border border-gray-300 rounded-lg
                  cursor-pointer focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Shown when user taps the banner • {formData.fullscreenMediaType === 'image' ? 'Image' : 'Video'} only
                </p>
                {fullscreenPreview && (
                  <div className="mt-2">
                    {formData.fullscreenMediaType === 'image' ? (
                      <img src={fullscreenPreview} alt="Fullscreen Preview" className="h-32 rounded border shadow-sm object-cover" />
                    ) : (
                      <video src={fullscreenPreview} controls className="h-32 rounded border shadow-sm" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                disabled={isUploading}
              >
                Cancel
              </button>
              <div className="flex-1 max-w-xs">
                {isUploading && (
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-blue-600">Uploading...</span>
                      <span className="text-xs font-medium text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={saveMutation.isPending || isUploading}
                  className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                >
                  {isUploading
                    ? `Uploading ${uploadProgress}%`
                    : saveMutation.isPending
                      ? 'Saving...'
                      : ad
                        ? '⚡ Update Advertisement'
                        : '⚡ Submit Advertisement'
                  }
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// Image Crop Modal Component
function ImageCropModal({
  imageSrc,
  targetWidth,
  targetHeight,
  onCrop,
  onCancel,
}: {
  imageSrc: string;
  targetWidth: number;
  targetHeight: number;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 300, height: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      // Calculate initial crop box based on aspect ratio
      const aspectRatio = targetWidth / targetHeight;
      const containerWidth = 600; // Max container width
      const containerHeight = 400; // Max container height

      let boxWidth = Math.min(containerWidth * 0.7, 400);
      let boxHeight = boxWidth / aspectRatio;

      if (boxHeight > containerHeight * 0.7) {
        boxHeight = containerHeight * 0.7;
        boxWidth = boxHeight * aspectRatio;
      }

      setCropArea({
        x: (containerWidth - boxWidth) / 2,
        y: (containerHeight - boxHeight) / 2,
        width: boxWidth,
        height: boxHeight,
      });
    };
    img.src = imageSrc;
  }, [imageSrc, targetWidth, targetHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is inside crop box
    if (
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.width &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newX = Math.max(0, Math.min(x - dragStart.x, rect.width - cropArea.width));
    const newY = Math.max(0, Math.min(y - dragStart.y, rect.height - cropArea.height));

    setCropArea({ ...cropArea, x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    const img = imageRef.current;

    // Calculate the scale between displayed image and actual image
    const displayedWidth = container.offsetWidth;
    const displayedHeight = container.offsetHeight;
    const scaleX = img.naturalWidth / displayedWidth;
    const scaleY = img.naturalHeight / displayedHeight;

    // Calculate crop coordinates in the original image
    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceWidth = cropArea.width * scaleX;
    const sourceHeight = cropArea.height * scaleY;

    // Draw the cropped area onto canvas at exact target dimensions
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
    onCrop(croppedImage);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">Crop Image</h3>
          <p className="text-sm text-gray-500 mt-1">
            Target size: {targetWidth} × {targetHeight}px • Drag the crop box to select area
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          <div
            ref={containerRef}
            className="relative inline-block bg-black rounded-lg overflow-hidden"
            style={{ maxWidth: '600px', maxHeight: '400px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageLoaded && (
              <>
                <img
                  src={imageSrc}
                  alt="Crop preview"
                  className="max-w-full max-h-[400px] block"
                  draggable={false}
                />

                {/* Overlay (darkened area outside crop box) */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top overlay */}
                  <div
                    className="absolute top-0 left-0 right-0 bg-black bg-opacity-60"
                    style={{ height: `${cropArea.y}px` }}
                  />
                  {/* Bottom overlay */}
                  <div
                    className="absolute left-0 right-0 bottom-0 bg-black bg-opacity-60"
                    style={{ top: `${cropArea.y + cropArea.height}px` }}
                  />
                  {/* Left overlay */}
                  <div
                    className="absolute left-0 bg-black bg-opacity-60"
                    style={{
                      top: `${cropArea.y}px`,
                      width: `${cropArea.x}px`,
                      height: `${cropArea.height}px`,
                    }}
                  />
                  {/* Right overlay */}
                  <div
                    className="absolute right-0 bg-black bg-opacity-60"
                    style={{
                      top: `${cropArea.y}px`,
                      left: `${cropArea.x + cropArea.width}px`,
                      height: `${cropArea.height}px`,
                    }}
                  />
                </div>

                {/* Crop Box */}
                <div
                  className="absolute border-2 border-white cursor-move"
                  style={{
                    left: `${cropArea.x}px`,
                    top: `${cropArea.y}px`,
                    width: `${cropArea.width}px`,
                    height: `${cropArea.height}px`,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 bg-white border-2 border-blue-500 rounded-full" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white border-2 border-blue-500 rounded-full" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-white border-2 border-blue-500 rounded-full" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-blue-500 rounded-full" />

                  {/* Grid lines */}
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white opacity-50" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white opacity-50" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white opacity-50" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white opacity-50" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            ✂️ Crop & Use Image
          </button>
        </div>
      </div>
    </div>
  );
}