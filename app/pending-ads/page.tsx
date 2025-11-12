'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, LogOut, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';
import Link from 'next/link';

interface PendingAd {
  id: string;
  title: string;
  phoneNumber: string;
  startDate: string;
  endDate: string;
  status: string;
  uploadedBy: string;
  uploaderName: string;
  priority: number;
  bottomImageId?: string;
  fullscreenImageId?: string;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
}

export default function PendingAdsPage() {
  const [selectedAd, setSelectedAd] = useState<PendingAd | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalPriority, setApprovalPriority] = useState(5);
  const queryClient = useQueryClient();
  const router = useRouter();

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

  // Fetch pending ads
  const { data: pendingAds, isLoading, error } = useQuery({
    queryKey: ['pendingAds'],
    queryFn: async () => {
      const response = await api.get('/admin/ads/pending');
      return response.data.ads;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Approve ad mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: number }) => {
      const response = await api.post(`/admin/ads/${id}/approve`, { priority });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAds'] });
      queryClient.invalidateQueries({ queryKey: ['ads'] }); // Also refresh main ads list
      setShowApproveModal(false);
      setSelectedAd(null);
      alert('Advertisement approved successfully!');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.message || 'Failed to approve advertisement'}`);
    },
  });

  // Reject ad mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/admin/ads/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAds'] });
      setShowRejectModal(false);
      setSelectedAd(null);
      setRejectionReason('');
      alert('Advertisement rejected');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.message || 'Failed to reject advertisement'}`);
    },
  });

  const handleApprove = () => {
    if (selectedAd) {
      approveMutation.mutate({ id: selectedAd.id, priority: approvalPriority });
    }
  };

  const handleReject = () => {
    if (selectedAd && rejectionReason.trim()) {
      rejectMutation.mutate({ id: selectedAd.id, reason: rejectionReason });
    } else {
      alert('Please provide a rejection reason');
    }
  };

  const getImageUrl = (imageId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://instantlly-cards-backend.onrender.com';
    return `${baseUrl}/api/ads/images/${imageId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-purple-600 hover:text-purple-800">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pending Advertisements</h1>
                <p className="text-sm text-gray-600">Review and approve channel partner ads</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Ads</p>
              <p className="text-3xl font-bold text-purple-600">{pendingAds?.length || 0}</p>
            </div>
            <AlertCircle className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        {/* Ads Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Ads Awaiting Approval</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading pending ads...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Failed to load pending ads</p>
            </div>
          ) : pendingAds && pendingAds.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sr</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploader</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingAds.map((ad, index) => (
                    <tr key={ad.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {ad.bottomImageId && (
                            <img
                              src={getImageUrl(ad.bottomImageId)}
                              alt="Bottom"
                              className="h-16 w-20 object-cover rounded cursor-pointer hover:scale-105 transition"
                              onClick={() => window.open(getImageUrl(ad.bottomImageId!), '_blank')}
                            />
                          )}
                          {ad.fullscreenImageId && (
                            <img
                              src={getImageUrl(ad.fullscreenImageId)}
                              alt="Fullscreen"
                              className="h-16 w-20 object-cover rounded cursor-pointer hover:scale-105 transition"
                              onClick={() => window.open(getImageUrl(ad.fullscreenImageId!), '_blank')}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{ad.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{ad.uploaderName}</div>
                          <div className="text-gray-500">{ad.uploadedBy}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ad.phoneNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>Start: {format(new Date(ad.startDate), 'MMM dd, yyyy')}</div>
                        <div>End: {format(new Date(ad.endDate), 'MMM dd, yyyy')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(ad.createdAt), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedAd(ad);
                              setApprovalPriority(5);
                              setShowApproveModal(true);
                            }}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAd(ad);
                              setRejectionReason('');
                              setShowRejectModal(true);
                            }}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No pending advertisements to review</p>
            </div>
          )}
        </div>
      </main>

      {/* Approve Modal */}
      {showApproveModal && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Advertisement</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to approve "<strong>{selectedAd.title}</strong>"?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={approvalPriority}
                onChange={(e) => setApprovalPriority(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Higher priority = more frequent display</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition"
              >
                {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedAd(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Advertisement</h3>
            <p className="text-gray-600 mb-4">
              Provide a reason for rejecting "<strong>{selectedAd.title}</strong>"
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Image quality is too low, Inappropriate content, etc."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedAd(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
