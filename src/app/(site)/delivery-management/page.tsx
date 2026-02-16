'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface DeliveryBoy {
  id: number;
  name: string;
  username: string;
  profile_image: string | null;
  pending_count: number;
  whatsapp: string | null;
}

interface ProductGroup {
  product_name: string;
  count: number;
  total_amount: number;
  advance_amount: number;
  monthly_amount: number;
  months: number;
}

interface BoyDetails {
  boy: {
    id: number;
    name: string;
    username: string;
    profile_image: string | null;
    whatsapp: string | null;
  };
  pending_products: ProductGroup[];
}

export default function DeliveryManagement() {
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [selectedBoyId, setSelectedBoyId] = useState<number | null>(null);
  const [boyDetails, setBoyDetails] = useState<BoyDetails | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const fetchDeliveryBoys = async (): Promise<void> => {
    try {
      const token = Cookies.get('auth_token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/delivery-management/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setDeliveryBoys(result.data);
      } else {
        toast.error(result.error || 'Failed to load delivery personnel');
      }
    } catch (error) {
      console.error('Error fetching delivery boys:', error);
      toast.error('Network error while loading delivery personnel');
    }
  };

  const fetchBoyDetails = async (boyId: number): Promise<void> => {
    setIsLoading(true);
    setSelectedBoyId(boyId);

    try {
      const token = Cookies.get('auth_token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/delivery-management/boy/${boyId}/details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setBoyDetails(result.data);
      } else {
        toast.error(result.error || 'Failed to load delivery boy details');
      }
    } catch (error) {
      console.error('Error fetching boy details:', error);
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateOtp = async (): Promise<void> => {
    if (!selectedBoyId) return;

    setIsActionLoading(true);

    try {
      const token = Cookies.get('auth_token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/delivery-management/generate-pickup-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deliveryBoyId: selectedBoyId }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('OTP has been generated and sent via WhatsApp');
      } else {
        toast.error(result.error || 'Failed to generate OTP');
      }
    } catch (error) {
      console.error('Error generating OTP:', error);
      toast.error('Failed to send OTP');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (!selectedBoyId || otpInput.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsActionLoading(true);

    try {
      const token = Cookies.get('auth_token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/delivery-management/verify-pickup-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deliveryBoyId: selectedBoyId, otp: otpInput }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Orders successfully marked as picked');
        setOtpInput('');
        // Refresh details
        await fetchBoyDetails(selectedBoyId);
      } else {
        toast.error(result.error || 'Invalid or expired OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Delivery Management
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column – List of delivery personnel */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sticky top-6">
            <h2 className="text-xl font-semibold mb-5 text-gray-800 dark:text-gray-200">
              Delivery Personnel
            </h2>

            {deliveryBoys.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No active delivery personnel found
              </p>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {deliveryBoys.map((boy) => (
                  <div
                    key={boy.id}
                    onClick={() => fetchBoyDetails(boy.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedBoyId === boy.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {boy.profile_image ? (
                        <img
                          src={boy.profile_image}
                          alt={boy.name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-semibold text-gray-600 dark:text-gray-300">
                          {boy.name.charAt(0)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {boy.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          @{boy.username}
                        </p>
                        <p className="text-sm font-medium mt-1 text-blue-700 dark:text-blue-400">
                          Pending: {boy.pending_count}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column – Details & OTP actions */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : selectedBoyId && boyDetails ? (
            <div className="space-y-10">
              {/* Profile header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-8 border-b border-gray-200 dark:border-gray-700">
                {boyDetails.boy.profile_image && (
                  <img
                    src={boyDetails.boy.profile_image}
                    alt={boyDetails.boy.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 shadow-sm"
                  />
                )}

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {boyDetails.boy.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    @{boyDetails.boy.username}
                  </p>
                  {boyDetails.boy.whatsapp && (
                    <p className="mt-2 text-green-600 dark:text-green-400 font-medium">
                      WhatsApp: {boyDetails.boy.whatsapp}
                    </p>
                  )}
                </div>
              </div>

              {/* Pending products */}
              <section>
                <h3 className="text-xl font-semibold mb-5 text-gray-800 dark:text-gray-200">
                  Pending Products to Deliver
                </h3>

                {boyDetails.pending_products.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                    No pending products at this time
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boyDetails.pending_products.map((product) => (
                      <div
                        key={product.product_name}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                          {product.product_name}
                        </h4>
                        <div className="text-4xl font-bold text-blue-700 dark:text-blue-400 mb-4">
                          {product.count}×
                        </div>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-gray-600 dark:text-gray-400">Total value:</span>{' '}
                            <strong className="text-gray-900 dark:text-white">
                              {product.total_amount.toLocaleString()} PKR
                            </strong>
                          </p>
                          <p>
                            Advance:{' '}
                            <strong>{product.advance_amount.toLocaleString()} PKR</strong>
                          </p>
                          <p>
                            Monthly:{' '}
                            <strong>
                              {product.monthly_amount.toLocaleString()} PKR × {product.months} mo
                            </strong>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* OTP Section */}
              <section className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-7 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
                  Pickup Confirmation (OTP)
                </h3>

                <div className="flex flex-col sm:flex-row gap-6">
                  <button
                    onClick={handleGenerateOtp}
                    disabled={isActionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex-1 sm:flex-none"
                  >
                    {isActionLoading ? 'Sending...' : 'Generate & Send OTP'}
                  </button>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter OTP received by delivery personnel
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="██████"
                        className="border border-gray-300 dark:border-gray-600 rounded-lg px-5 py-3 text-center text-2xl tracking-widest font-mono w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleVerifyOtp}
                        disabled={isActionLoading || otpInput.length !== 6}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-10 py-3.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex-1 sm:flex-none"
                      >
                        {isActionLoading ? 'Verifying...' : 'Verify & Confirm Pickup'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
              <p className="text-xl mb-2">Select a delivery personnel</p>
              <p>from the list on the left to view details and manage pickup</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}