'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Trash2, Edit, Calendar, LogOut, LayoutGrid } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Ad {
  _id: string;
  title: string;
  bottomImage?: string; // Now optional (excluded from list query)
  fullscreenImage?: string; // Now optional (excluded from list query)
  bottomImageGridFS?: string; // GridFS reference
  fullscreenImageGridFS?: string; // GridFS reference
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
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://instantlly-cards-backend-6ki0.onrender.com';
  return `${baseUrl}/api/ads/image/${adId}/${type}`;
};

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

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
      console.log('🔗 URL:', api.defaults.baseURL + '/ads');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const startTime = Date.now();
      
      try {
        console.log('📤 Sending GET request to backend...');
        const response = await api.get('/ads');
        const requestTime = Date.now() - startTime;
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ [FRONTEND] Response received!');
        console.log('⏱️  Request time:', requestTime, 'ms');
        console.log('📊 Status:', response.status);
        console.log('📦 Data received:', response.data?.data?.length || 0, 'ads');
        console.log('🐛 Debug info:', response.data?.debug);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return response.data.data;
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
      // Fetch complete ad data including images
      const response = await api.get(`/ads/${ad._id}`);
      const completeAd = response.data.data;
      
      console.log('✅ [FRONTEND] Complete ad data fetched');
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
            <h2 className="text-xl font-bold text-gray-900">All Advertisements</h2>
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
                  {adsData.map((ad: Ad, index: number) => {
                    const active = isAdActive(ad);
                    return (
                      <tr key={ad._id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 lg:px-6 py-4 text-xs sm:text-sm font-medium text-gray-900">{index + 1}</td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="flex flex-col space-y-2">
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
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{ad.title}</div>
                          {(ad.fullscreenImage || ad.fullscreenImageGridFS) ? (
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
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                              active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {active ? '✓ Active' : '⏸ Scheduled'}
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
                No ads found. Create your first ad to get started!
              </div>
            )}
          </div>
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
  const [formData, setFormData] = useState({
    title: ad?.title || '',
    bottomImage: ad?.bottomImage || '',
    fullscreenImage: ad?.fullscreenImage || '',
    phoneNumber: ad?.phoneNumber || '',
    startDate: ad ? format(new Date(ad.startDate), 'yyyy-MM-dd') : '',
    endDate: ad ? format(new Date(ad.endDate), 'yyyy-MM-dd') : '',
    priority: ad?.priority || 5,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (ad) {
        await api.put(`/ads/${ad._id}`, data);
      } else {
        await api.post('/ads', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    },
  });

  const handleBottomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, bottomImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFullscreenImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, fullscreenImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {ad ? 'Edit Advertisement' : 'Create New Advertisement'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Advertisement Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Summer Sale 2024"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Bottom Banner Image (Required)</h3>
            <p className="text-sm text-gray-600 mb-4">
              This image appears in the bottom carousel. Recommended size: <strong>624 × 174 pixels</strong>
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleBottomImageUpload}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={!ad}
            />
            {formData.bottomImage && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <img src={formData.bottomImage} alt="Bottom Banner Preview" className="max-h-32 rounded border shadow-sm" />
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🖼️ Fullscreen Image (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              This image appears when user taps the bottom banner. Recommended size: <strong>624 × 1000 pixels</strong>
              <br />
              <span className="text-xs text-amber-600">
                💡 If not provided, users will see Call/Message/Cancel buttons when they tap the banner.
              </span>
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFullscreenImageUpload}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.fullscreenImage && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                <img src={formData.fullscreenImage} alt="Fullscreen Preview" className="max-h-48 rounded border shadow-sm" />
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">📞 Phone Number (for Call/Message buttons)</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+919876543210"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for Call/Message buttons in the mobile app
            </p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Schedule</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ad will automatically become active between these dates
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {saveMutation.isPending ? 'Saving...' : ad ? 'Update Advertisement' : 'Create Advertisement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
