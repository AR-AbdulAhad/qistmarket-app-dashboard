'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import Loader from '@/components/common/Loader';
// import { DeliveryActionsModal } from '@/components/DeliveryManagement/DeliveryActionsModal';
// import { DeliveryTable } from '@/components/DeliveryManagement/DeliveryTable';
import { DeliveryStats } from '@/components/DeliveryManagement/DeliveryStats';
import { SearchIcon } from '@/assets/icons';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface DeliveryBoy {
  id: number;
  name: string;
  username: string;
  profile_image: string | null;
  pending_count: number;
  whatsapp: string | null;
  is_online: boolean;
  delivered_today: number;
  returned_today: number;
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
    is_online: boolean;
    last_online_at: string | null;
  };
  pending_products: ProductGroup[];
}

interface DeliveryOrder {
  id: number;
  order_ref: string;
  customer_name: string;
  address: string;
  product_name: string;
  amount: number;
  status: string;
  delivery_officer: { username: string; full_name: string } | null;
  updated_at: string;
}

export default function DeliveryOfficers() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'all_deliveries'>('dashboard');

  // Dashboard State
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [filteredBoys, setFilteredBoys] = useState<DeliveryBoy[]>([]);
  const [boySearch, setBoySearch] = useState('');

  const [selectedBoyId, setSelectedBoyId] = useState<number | null>(null);
  const [boyDetails, setBoyDetails] = useState<BoyDetails | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // All Deliveries State
  const [allDeliveries, setAllDeliveries] = useState<DeliveryOrder[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [actionType, setActionType] = useState<'deliver' | 'return' | 'refund' | null>(null);

  // KPI Stats Top Row
  const totalRiders = deliveryBoys.length;
  const activeDeliveries = allDeliveries.filter(d => d.status === 'in_transit' || d.status === 'picked_up').length;
  const completedToday = deliveryBoys.reduce((sum, b) => sum + (b.delivered_today || 0), 0);
  const returnedToday = deliveryBoys.reduce((sum, b) => sum + (b.returned_today || 0), 0);

  useEffect(() => {
    fetchDeliveryBoys();
    fetchAllDeliveries();
  }, []);

  useEffect(() => {
    if (boySearch.trim() === '') {
      setFilteredBoys(deliveryBoys);
    } else {
      const lower = boySearch.toLowerCase();
      setFilteredBoys(deliveryBoys.filter(boy =>
        boy.name.toLowerCase().includes(lower) ||
        boy.username.toLowerCase().includes(lower)
      ));
    }
  }, [boySearch, deliveryBoys]);

  const fetchDeliveryBoys = async (): Promise<void> => {
    try {
      const token = Cookies.get('auth_token');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/delivery-management/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setDeliveryBoys(result.data);
        setFilteredBoys(result.data);
      }
    } catch (error) {
      console.error('Error fetching delivery boys:', error);
    }
  };

  const fetchBoyDetails = async (boyId: number): Promise<void> => {
    setIsLoading(true);
    setSelectedBoyId(boyId);
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/delivery-management/boy/${boyId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setBoyDetails(result.data);
      }
    } catch (error) {
      console.error('Error fetching boy details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateOtp = async (): Promise<void> => {
    if (!selectedBoyId) return;
    setIsActionLoading(true);
    try {
      const token = Cookies.get('auth_token');
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
      toast.error('Failed to send OTP');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (!selectedBoyId || otpInput.length !== 5) {
      toast.error('Please enter a valid 5-digit OTP');
      return;
    }
    setIsActionLoading(true);
    try {
      const token = Cookies.get('auth_token');
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
        await fetchBoyDetails(selectedBoyId);
        fetchAllDeliveries(); // Refresh stats
      } else {
        toast.error(result.error || 'Invalid or expired OTP');
      }
    } catch (error) {
      toast.error('Failed to verify OTP');
    } finally {
      setIsActionLoading(false);
    }
  };

  const fetchAllDeliveries = async () => {
    setDeliveriesLoading(true);
    try {
      const token = Cookies.get('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/orders/delivery-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAllDeliveries(result.data);
        }
      } else {
        setAllDeliveries([]);
      }
    } catch (error) {
      console.error('Failed to fetch deliveries', error);
      setAllDeliveries([]);
    } finally {
      setDeliveriesLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-title-md2 font-bold text-black dark:text-white">
            Delivery Officers
          </h2>
          <p className="font-medium">Manage riders, pickups, and track overall delivery performance.</p>
        </div>

        <div className="flex rounded-lg bg-gray-2 p-1 dark:bg-meta-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`rounded-md py-2 px-6 text-sm font-medium transition-all duration-200 ${activeTab === 'dashboard'
              ? 'bg-white text-primary shadow-card dark:bg-boxdark dark:text-white'
              : 'text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('all_deliveries')}
            className={`rounded-md py-2 px-6 text-sm font-medium transition-all duration-200 ${activeTab === 'all_deliveries'
              ? 'bg-white text-primary shadow-card dark:bg-boxdark dark:text-white'
              : 'text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            All Deliveries
          </button>
        </div>
      </div>

      {/* KPI Stats Top Row */}
      <DeliveryStats
        totalRiders={totalRiders}
        activeDeliveries={activeDeliveries}
        completedToday={completedToday}
        returnedToday={returnedToday}
      />

      {activeTab === 'dashboard' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Rider Selection List - Left Side */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
              <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark bg-gray-50 dark:bg-meta-4/20">
                <h3 className="font-semibold text-black dark:text-white">
                  Delivery Riders
                </h3>
              </div>

              <div className="p-4 border-b border-stroke dark:border-strokedark">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <SearchIcon className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search rider..."
                    value={boySearch}
                    onChange={(e) => setBoySearch(e.target.value)}
                    className="w-full rounded-lg border border-stroke bg-transparent py-2.5 pl-11 pr-5 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col max-h-[600px] overflow-y-auto">
                {filteredBoys.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No riders found.</div>
                ) : (
                  filteredBoys.map((boy) => (
                    <div
                      key={boy.id}
                      onClick={() => fetchBoyDetails(boy.id)}
                      className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all border-l-4 ${selectedBoyId === boy.id
                        ? 'bg-gray-50 dark:bg-meta-4/30 border-primary'
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-meta-4/20'
                        }`}
                    >
                      <div className="relative h-12 w-12 flex-shrink-0">
                        {boy.profile_image ? (
                          <img
                            src={boy.profile_image}
                            alt={boy.name}
                            className="h-full w-full rounded-full object-cover border border-stroke dark:border-strokedark shadow-sm"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-gray-200 dark:bg-meta-4 flex items-center justify-center text-lg font-bold text-gray-500">
                            {boy.name.charAt(0)}
                          </div>
                        )}
                        <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-boxdark ${boy.is_online ? 'bg-success' : 'bg-gray-300'}`}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-black dark:text-white truncate">
                            {boy.name}
                          </h4>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${boy.is_online ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'}`}>
                            {boy.is_online ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex gap-2 text-[10px] font-bold">
                            <span className="text-success">D: {boy.delivered_today || 0}</span>
                            <span className="text-danger">R: {boy.returned_today || 0}</span>
                          </div>
                          {boy.pending_count > 0 && (
                            <span className="inline-flex items-center justify-center rounded-full bg-primary py-0.5 px-2 text-[10px] font-bold text-white shadow-sm">
                              {boy.pending_count} PENDING
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Rider Details and Actions - Right Side */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            {isLoading ? (
              <Loader text="Loading rider details..." className="h-[400px] items-center justify-center rounded-xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark" />
            ) : selectedBoyId && boyDetails ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                {/* Rider Profile Card */}
                <div className="rounded-xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="h-24 w-24 flex-shrink-0 rounded-full border-4 border-gray-100 dark:border-meta-4 overflow-hidden shadow-lg">
                      {boyDetails.boy.profile_image ? (
                        <img src={boyDetails.boy.profile_image} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center text-3xl font-bold dark:bg-meta-4">
                          {boyDetails.boy.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold text-black dark:text-white">
                          {boyDetails.boy.name}
                        </h3>
                        <span className="inline-flex rounded bg-success/10 py-1 px-3 text-sm font-bold text-success">
                          Active
                        </span>
                      </div>
                      <p className="font-medium text-gray-500">@{boyDetails.boy.username}</p>
                      {boyDetails.boy.whatsapp && (
                        <div className="mt-3 flex items-center gap-2 text-green-600 font-semibold">
                          <svg className="fill-current" width="18" height="18" viewBox="0 0 24 24"><path d="M12.031 2c-5.511 0-9.997 4.486-9.997 9.998 0 1.767.459 3.428 1.259 4.878l-1.293 4.735 4.854-1.274c1.401.761 2.993 1.2 4.672 1.2 5.513 0 9.99-4.487 9.99-9.999 0-5.511-4.486-9.998-9.985-9.998zm3.037 14.12c-.237.669-1.4 1.218-1.928 1.297-.48.071-.856.347-3.003-.547-2.75-1.146-4.52-3.931-4.659-4.114-.139-.181-1.135-1.503-1.135-2.868 0-1.365.717-2.035.973-2.314.197-.215.523-.32.839-.32.103 0 .197.005.281.01.271.012.399.014.573.431.218.522.744 1.815.809 1.944.065.129.109.28.022.455-.088.174-.131.28-.261.431l-.398.463c-.131.144-.271.3-.117.564.153.264.679 1.119 1.455 1.81.996.888 1.835 1.163 2.099 1.294.264.131.417.109.57.022.153-.087.653-.761.827-1.021.174-.261.348-.218.587-.131.239.088 1.52.717 1.781.847.261.13.435.196.499.305.064.108.064.63-.173 1.299z" /></svg>
                          WhatsApp: {boyDetails.boy.whatsapp}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pickup/OTP Action Card */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-default dark:border-primary/30 dark:bg-primary/5">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-black dark:text-white mb-2">Pickup Confirmation</h4>
                      <p className="font-medium text-gray-600 dark:text-gray-400">
                        Authorize the load pickup by generating an OTP. Verify the code provided by the rider to confirm assignment.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                      <div className="relative w-full sm:w-48">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="OTP Code"
                          className="w-full rounded-lg border border-primary/30 bg-white py-3.5 px-4 text-center text-xl font-bold tracking-widest outline-none focus:border-primary dark:bg-black dark:border-strokedark"
                        />
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <button
                          onClick={handleGenerateOtp}
                          disabled={isActionLoading}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-blue-600 py-3.5 px-6 font-bold text-white hover:bg-opacity-90 transition disabled:opacity-50"
                        >
                          {isActionLoading ? '...' : 'Send OTP'}
                        </button>
                        <button
                          onClick={handleVerifyOtp}
                          disabled={isActionLoading || otpInput.length !== 5}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-success py-3.5 px-8 font-bold text-white hover:bg-opacity-90 transition disabled:opacity-50"
                        >
                          {isActionLoading ? '...' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Allocated Products Grid */}
                <div className="space-y-4">
                  <h4 className="text-title-sm font-bold text-black dark:text-white pl-1">
                    Allocated Inventory
                    <span className="ml-2 text-sm font-medium text-gray-500">
                      ({boyDetails.pending_products.length} categories)
                    </span>
                  </h4>

                  {boyDetails.pending_products.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-stroke bg-gray-50 p-10 text-center dark:border-strokedark dark:bg-boxdark">
                      <p className="font-medium text-gray-500">No pending products allocated to this rider.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {boyDetails.pending_products.map((product) => (
                        <div key={product.product_name} className="relative overflow-hidden rounded-xl border border-stroke bg-white p-5 shadow-sm hover:shadow-md transition-all dark:border-strokedark dark:bg-boxdark group">
                          <div className="mb-4">
                            <h5 className="text-lg font-bold text-black dark:text-white truncate" title={product.product_name}>
                              {product.product_name}
                            </h5>
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">Product Group</span>
                          </div>

                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-4xl font-black text-black dark:text-white group-hover:text-primary transition-colors">
                                {product.count}
                                <span className="text-sm font-bold text-gray-400 ml-1">UNITS</span>
                              </p>
                              <p className="text-sm font-semibold text-gray-500 mt-1">
                                Value: <span className="text-black dark:text-white">{product.total_amount.toLocaleString()} PKR</span>
                              </p>
                            </div>
                            <div className="text-right text-[10px] font-bold text-gray-400 space-y-0.5">
                              <p>ADVANCE: {product.advance_amount.toLocaleString()}</p>
                              <p>PLAN: {product.monthly_amount.toLocaleString()} × {product.months}</p>
                            </div>
                          </div>
                          <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-all"></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-[500px] flex-col items-center justify-center rounded-xl border border-dashed border-stroke bg-gray-50 text-center dark:border-strokedark dark:bg-boxdark">
                <div className="mb-6 rounded-full bg-white dark:bg-meta-4 p-8 shadow-sm">
                  <svg className="h-16 w-16 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-black dark:text-white">Select a Rider</h3>
                <p className="max-w-xs font-medium text-gray-500">
                  Select a delivery personnel from the sidebar to manage their workload and verify pickups.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* All Deliveries Tab - Tracking and Historical Data */
        <div className="animate-in fade-in duration-500">
          {/* <DeliveryTable
            data={allDeliveries}
            loading={deliveriesLoading}
            onMarkDelivered={(order) => {
              setSelectedOrder(order);
              setActionType('deliver');
            }}
            onMarkReturned={(order) => {
              setSelectedOrder(order);
              setActionType('return');
            }}
            onMarkRefunded={(order) => {
              setSelectedOrder(order);
              setActionType('refund');
            }}
          />

          <DeliveryActionsModal
            isOpen={!!selectedOrder}
            onClose={() => {
              setSelectedOrder(null);
              setActionType(null);
            }}
            orderId={selectedOrder?.id || null}
            actionType={actionType as any}
            onSuccess={() => {
              fetchAllDeliveries();
            }}
          /> */}
        </div>
      )}
    </div>
  );
}

