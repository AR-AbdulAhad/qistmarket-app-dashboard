"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  X, Search, ShoppingBag, User, CheckCircle2, 
  AlertCircle, ChevronDown, Check, Calculator, Key, 
  CreditCard, Calendar, ArrowRight, PackageOpen, 
  MessageSquare, ShieldCheck, ArrowLeft, ChevronRight,
  Info, Smartphone, QrCode, Camera, UserCheck, ImageIcon,
  RefreshCcw, FlipHorizontal, Scissors, Maximize, CheckCircle, RotateCcw
} from 'lucide-react';
import { InstallmentLedgerEditor } from '@/components/Installments/InstallmentLedgerEditor';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Loader from '@/components/common/Loader';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function SelfPickupPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedInventory, setSelectedInventory] = useState<any>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  
  const [activeStep, setActiveStep] = useState(1);

  // OTP States
  const [otpMode, setOtpMode] = useState<'with_otp' | 'without_otp'>('with_otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Suggested Plans
  const [suggestedPlans, setSuggestedPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [advanceOverride, setAdvanceOverride] = useState<number | ''>('');
  const [ledger, setLedger] = useState<any[]>([]);
  const [feedback, setFeedback] = useState('');
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isMirrored, setIsMirrored] = useState(true);
  
  // Custom Cash Price
  const [cashPriceInput, setCashPriceInput] = useState<number | ''>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const getDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating devices:", err);
    }
  };

  useEffect(() => {
    if (activeStep === 4) {
      getDevices();
    }
  }, [activeStep]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('auth_token');
      const res = await fetch(`${BACKEND_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Order not found');
      const json = await res.json();
      if (json.success) {
        const orderData = json.data.order;
        setOrder(orderData);
        setPhone(orderData.verification?.purchaser?.telephone_number || orderData.whatsapp_number || '');
        
        // Plans are generated when the user selects an inventory item (see handleInventorySelect)
        // Pre-match the order's duration if a plan gets set later
        const price = orderData.total_amount || 0;
        if (price > 0) {
          // Store for later matching when inventory is selected
          setOrder((prev: any) => ({ ...(prev || orderData), _prefill_months: orderData.months }));
        }
      } else {
        throw new Error(json.message || 'Failed to fetch order');
      }
    } catch (err: any) {
      toast.error(err.message);
      router.push('/approved-order-list');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const token = Cookies.get('auth_token');
      const res = await fetch(`${BACKEND_URL}/api/orders/self-pickup/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInventory(data.data);
      }
    } catch (error) {
      console.error('Fetch inventory error:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
      fetchInventory();
    }
  }, [id]);

  const roundUp = (val: number) => Math.ceil(val / 50) * 50;

  // Same formula as CreateOrder — generates normalized plans with {advance, totalPrice, monthlyAmount, months, isActive}
  const calculateInstallments = (category: string, price: number): any[] => {
    const cat = category.toLowerCase().trim();
    let plans: any[] = [];

    if (cat === 'mobiles' && price <= 50000) {
      plans = [
        { months: 3, profit: 0.20, advance: 0.35 },
        { months: 6, profit: 0.35, advance: 0.25 },
        { months: 9, profit: 0.45, advance: 0.20 },
        { months: 12, profit: 0.55, advance: 0.15 },
      ];
    } else if (price > 50000 && price <= 100000) {
      plans = [
        { months: 3, profit: 0.20, advance: 0.40 },
        { months: 6, profit: 0.35, advance: 0.35 },
        { months: 9, profit: 0.45, advance: 0.30 },
        { months: 12, profit: 0.55, advance: 0.25 },
      ];
    } else if (price > 100000) {
      plans = [
        { months: 3, profit: 0.20, advance: 0.40 },
        { months: 6, profit: 0.35, advance: 0.35 },
        { months: 9, profit: 0.45, advance: 0.30 },
        { months: 12, profit: 0.55, advance: 0.25 },
        { months: 24, profit: 0.85, advance: 0.25 },
      ];
    } else {
      plans = [
        { months: 3, profit: 0.22, advance: 0.40 },
        { months: 6, profit: 0.38, advance: 0.35 },
        { months: 9, profit: 0.48, advance: 0.30 },
        { months: 12, profit: 0.60, advance: 0.25 },
      ];
    }

    return plans.map(p => {
      const adv = roundUp(price * p.advance);
      const rem = price - adv;
      const profit = roundUp(rem * p.profit);
      const total = rem + profit;
      const monthly = roundUp(total / p.months);
      const fullTotal = adv + (monthly * p.months);
      return {
        advance: adv,
        monthlyAmount: monthly,
        totalPrice: fullTotal,
        months: p.months,
        isActive: true,
      };
    });
  };

  const handleInventorySelect = (item: any) => {
    setSelectedInventory(item);
    setIsInventoryOpen(false);
    setSearch(item.imei_serial || '');
    setSelectedPlan(null);
    setLedger([]);
    setCashPriceInput(''); // Reset custom cash price on new selection

    // Prefer stored installment_plans from inventory; fallback to generated
    const storedPlans: any[] = Array.isArray(item.installment_plans)
      ? item.installment_plans.filter((p: any) => p.isActive !== false)
      : [];

    if (storedPlans.length > 0) {
      setSuggestedPlans(storedPlans);
    } else if (item.purchase_price > 0) {
      // Use category and purchase_price for generating installments as per user instructions
      const generated = calculateInstallments(item.category || '', item.purchase_price);
      setSuggestedPlans(generated);
    } else {
      setSuggestedPlans([]);
    }
    setActiveStep(2);
  };

  // Re-calculate plans when custom cash price is entered
  useEffect(() => {
    if (activeStep !== 2 || !selectedInventory) return;

    if (cashPriceInput && Number(cashPriceInput) > 0) {
      const generated = calculateInstallments(selectedInventory.category || '', Number(cashPriceInput));
      setSuggestedPlans(generated);
      setSelectedPlan(null); // Clear selection so they must re-select
      setLedger([]);
    } else {
      // Revert to default
      const storedPlans: any[] = Array.isArray(selectedInventory.installment_plans)
        ? selectedInventory.installment_plans.filter((p: any) => p.isActive !== false)
        : [];
      if (storedPlans.length > 0) {
        setSuggestedPlans(storedPlans);
      } else if (selectedInventory.purchase_price > 0) {
        setSuggestedPlans(calculateInstallments(selectedInventory.category || '', selectedInventory.purchase_price));
      } else {
        setSuggestedPlans([]);
      }
      setSelectedPlan(null);
      setLedger([]);
    }
  }, [cashPriceInput]);

  // Normalize plan to standard shape before storing
  const handlePlanSelect = (plan: any) => {
    const normalized = {
      advance: plan.advance ?? plan.advanceAmount ?? 0,
      totalPrice: plan.totalPrice ?? 0,
      monthlyAmount: plan.monthlyAmount ?? 0,
      months: plan.months ?? 0,
      isActive: true,
    };
    setSelectedPlan(normalized);
    setAdvanceOverride(normalized.advance);
  };

  const sendOTP = async () => {
    if (!phone) return toast.error('Phone number required');
    setOtpLoading(true);
    try {
        const token = Cookies.get('auth_token');
        const res = await fetch(`${BACKEND_URL}/api/orders/self-pickup/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ phone })
        });
        const data = await res.json();
        if (data.success) {
            setOtpSent(true);
            toast.success('OTP sent successfully');
        } else {
            toast.error(data.message || 'Failed to send OTP');
        }
    } catch (e) {
        toast.error('Network error while sending OTP');
    } finally {
        setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) return toast.error('Enter OTP');
    setOtpLoading(true);
    try {
        const token = Cookies.get('auth_token');
        const res = await fetch(`${BACKEND_URL}/api/orders/self-pickup/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ phone, otp })
        });
        const data = await res.json();
        if (data.success) {
            setOtpVerified(true);
            toast.success('OTP Verified!');
            setTimeout(() => setActiveStep(4), 500);
        } else {
            toast.error(data.message || 'Invalid OTP');
        }
    } catch (e) {
        toast.error('Verification failed');
    } finally {
        setOtpLoading(false);
    }
  };

  const startCamera = async (deviceId?: string) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        stopCamera();
      }
      
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      toast.error("Could not access camera. Please check permissions.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const autoCrop = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              img,
              (img.width - size) / 2,
              (img.height - size) / 2,
              size,
              size,
              0,
              0,
              size,
              size
            );
            resolve(canvas.toDataURL('image/jpeg', 0.9));
          } else {
            resolve(dataUrl);
          }
        } catch (e) {
          console.error("Crop error:", e);
          resolve(dataUrl);
        }
      };
      img.onerror = () => {
        console.error("Image load error for cropping");
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (isMirrored) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          
          const rawData = canvas.toDataURL('image/jpeg', 0.95);
          setFaceImage(rawData);
          setIsEditing(true);
          stopCamera();

          // Perform "Advanced Optimization" (Auto-Crop)
          const cropped = await autoCrop(rawData);
          setFaceImage(cropped);
          
          // Small delay for visual feedback before hiding the loader
          setTimeout(() => {
            setIsEditing(false);
          }, 800);
        }
      } catch (err) {
        console.error("Capture error:", err);
        setIsEditing(false);
        toast.error("Failed to capture image correctly.");
      }
    }
  };

  const handleManualOptimize = async () => {
    if (!faceImage) return;
    setIsEditing(true);
    try {
      const cropped = await autoCrop(faceImage);
      setFaceImage(cropped);
      setTimeout(() => {
        setIsEditing(false);
      }, 1000);
    } catch (err) {
      console.error("Manual optimize error:", err);
      setIsEditing(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedInventory) return toast.error('Select an item from inventory');
    if (!selectedPlan) return toast.error('Select an installment plan');
    if (otpMode === 'with_otp' && !otpVerified) return toast.error('Please verify OTP first');
    if (!faceImage) return toast.error('Please capture a face image for verification');

    setIsSubmitting(true);
    try {
        const token = Cookies.get('auth_token');
        // Compute final monthly if advance was overridden
        const finalAdvance = Number(advanceOverride);
        const finalMonthly = finalAdvance !== selectedPlan.advance
          ? roundUp((selectedPlan.totalPrice - finalAdvance) / selectedPlan.months)
          : selectedPlan.monthlyAmount;

        const submittedPlan = {
          advance: finalAdvance,
          totalPrice: selectedPlan.totalPrice,
          monthlyAmount: finalMonthly,
          months: selectedPlan.months,
          isActive: true,
        };

        const formData = new FormData();
        formData.append('order_id', String(id));
        formData.append('product_imei', selectedInventory.imei_serial);
        formData.append('selected_plan', JSON.stringify(submittedPlan));
        formData.append('custom_ledger', JSON.stringify(ledger));
        formData.append('phone', phone);
        formData.append('feedback', feedback);

        if (faceImage) {
           // Convert base64 to blob
           const res = await fetch(faceImage);
           const blob = await res.blob();
           formData.append('face_photo', blob, 'face_photo.jpg');
        }

        const res = await fetch(`${BACKEND_URL}/api/orders/self-pickup/submit`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        if (data.success) {
            toast.success('Service Pickup Completed!');
            router.push('/approved-order-list');
        } else {
            toast.error(data.message || 'Submission failed');
        }
    } catch (e) {
        toast.error('Error submitting delivery');
    } finally {
        setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (item.imei_serial && item.imei_serial.includes(search))
  );

  if (loading) return <Loader text="Loading self-pickup details..." />;

  const steps = [
    { id: 1, name: 'Assets', icon: Smartphone },
    { id: 2, name: 'Plan', icon: Calculator },
    { id: 3, name: 'Verify', icon: Key },
    { id: 4, name: 'Face ID', icon: Camera },
    { id: 5, name: 'Finalize', icon: CheckCircle2 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 min-h-screen bg-white shadow-1 rounded-[10px]">
      <div className="flex items-center justify-between mb-8">
        <div>
           <Breadcrumb pageName={`Self Pickup / ${order?.order_ref}`} />
           <p className="text-gray-400 font-medium text-sm mt-1">Configure and release asset from branch inventory</p>
        </div>
        <button 
          onClick={() => router.push('/approved-order-list')}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all font-bold shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Exit Flow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Interface */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Progress Ribbon */}
          <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden">
             {steps.map((s, i) => (
                <div 
                  key={s.id} 
                  className={cn(
                    "relative z-10 flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl transition-all cursor-pointer",
                    activeStep === s.id ? "bg-red-600 text-white shadow-lg shadow-red-100" : "text-gray-400 hover:text-gray-600"
                  )}
                  onClick={() => {
                    // Only allow navigating back or to steps already "validatable"
                    if (s.id < activeStep || (s.id === 2 && selectedInventory)) {
                      setActiveStep(s.id);
                    }
                  }}
                >
                   <s.icon className={cn("w-5 h-5", activeStep === s.id ? "animate-pulse" : "")} />
                   <span className="font-black text-xs uppercase tracking-widest hidden md:block">{s.name}</span>
                </div>
             ))}
             <div className="absolute inset-y-0 left-0 bg-gray-50/50 w-full z-0" />
          </div>

          {/* Dynamic Step Content */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
                
                {/* Step 1: Inventory Selection */}
                {activeStep === 1 && (
                  <div className="p-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                           <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-gray-900 tracking-tight">Select Physical Stock</h3>
                           <p className="text-gray-400 text-sm font-bold">Scanning branch inventory for {order?.product_name}</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Enter IMEI or Scan QR..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-16 pr-20 py-6 bg-gray-50/50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-3xl outline-none transition-all font-black text-xl placeholder:text-gray-300 shadow-inner"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400">
                            <QrCode className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="mt-8 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredInventory.length > 0 ? (
                            filteredInventory.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleInventorySelect(item)}
                                    className={cn(
                                      "w-full p-6 text-left border-2 rounded-3xl transition-all flex items-center justify-between group",
                                      selectedInventory?.id === item.id 
                                        ? "border-emerald-500 bg-emerald-50/50" 
                                        : "border-gray-50 bg-white hover:border-red-100 hover:shadow-lg hover:shadow-red-50/50"
                                    )}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                                          selectedInventory?.id === item.id ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-red-50 group-hover:text-red-600"
                                        )}>
                                            <Smartphone className="w-7 h-7" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-black text-gray-900 text-lg">{item.product_name}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg uppercase tracking-tighter">IMEI: {item.imei_serial}</span>
                                                <span className="text-xs font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg uppercase tracking-tighter">Color: {item.color_variant}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-right">
                                       <div className="hidden sm:block">
                                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Branch Stock</p>
                                          <p className="text-emerald-600 font-bold">In Stock</p>
                                       </div>
                                       {selectedInventory?.id === item.id ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <ChevronRight className="w-6 h-6 text-gray-200 group-hover:text-red-300" />}
                                    </div>
                                </button>
                            ))
                        ) : (
                           <div className="py-20 text-center bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                               <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                               <p className="text-gray-400 font-black text-lg">No matching stock found</p>
                               <p className="text-gray-300 text-sm font-bold">Try searching by full IMEI or model name</p>
                           </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Step 2: Financial Configuration */}
                {activeStep === 2 && (
                  <div className="p-10 animate-in fade-in slide-in-from-right-5 duration-500">
                     <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                              <Calculator className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Financial Schedule</h3>
                              <p className="text-gray-400 text-sm font-bold">Configure installment plan for {selectedInventory?.product_name}</p>
                            </div>
                        </div>

                        {/* Custom Cash Price Input */}
                        <div className="bg-gray-50 border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-4 w-full md:w-auto">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Custom Cash Price</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-black">Rs.</span>
                                    <input 
                                        type="number" 
                                        placeholder="Default"
                                        value={cashPriceInput}
                                        onChange={(e) => setCashPriceInput(e.target.value ? Number(e.target.value) : '')}
                                        className="bg-transparent border-none outline-none font-black text-xl text-gray-900 placeholder:text-gray-300 w-32"
                                    />
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-500">
                                <RefreshCcw className="w-5 h-5" />
                            </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {suggestedPlans.map((plan, idx) => {
                          // Normalize field names — stored plans use `advance`, generated also use `advance` now
                          const planAdvance = plan.advance ?? plan.advanceAmount ?? 0;
                          const planMonthly = plan.monthlyAmount ?? 0;
                          const planTotal = plan.totalPrice ?? 0;
                          const isSelected = selectedPlan?.months === plan.months;
                          return (
                           <button
                             key={idx}
                             onClick={() => handlePlanSelect(plan)}
                             className={cn(
                               "relative p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group w-full",
                               isSelected
                                 ? "border-blue-500 bg-blue-50 shadow-xl shadow-blue-50"
                                 : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg"
                             )}
                           >
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center",
                                isSelected ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                              )}>
                                 <span className="text-2xl font-black">{plan.months}</span>
                              </div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Months</p>
                              <div className="text-center space-y-1 w-full">
                                 <p className="text-base font-black text-gray-900">Rs. {planMonthly.toLocaleString()}<span className="text-xs font-medium text-gray-400">/mo</span></p>
                                 <p className="text-xs text-gray-400">Advance: <span className="font-bold text-gray-700">Rs. {planAdvance.toLocaleString()}</span></p>
                                 <p className="text-[10px] text-gray-400">Total: Rs. {planTotal.toLocaleString()}</p>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-blue-500" />}
                           </button>
                          );
                        })}
                     </div>

                     {/* Advance & Ledger */}
                     {selectedPlan && (
                       <div className="space-y-8">
                          <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                             <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-blue-400">
                                   <CreditCard className="w-8 h-8" />
                                </div>
                                <div>
                                   <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Advance Payment</p>
                                   <div className="flex items-baseline gap-2">
                                      <span className="text-4xl font-black tracking-tighter">Rs. {Number(advanceOverride).toLocaleString()}</span>
                                      <span className="text-gray-500 text-xs font-bold font-mono">/ Due At Branch</span>
                                   </div>
                                </div>
                             </div>
                             <div className="w-full md:w-auto flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                                <label className="text-xs font-black text-gray-400 uppercase ml-2">Edit Down Payment</label>
                                <input 
                                  type="number"
                                  value={advanceOverride}
                                  onChange={(e) => setAdvanceOverride(e.target.value ? Number(e.target.value) : '')}
                                  className="bg-transparent border-b-2 border-blue-500/50 focus:border-blue-500 font-black text-2xl text-white w-32 outline-none p-1 text-right"
                                />
                             </div>
                          </div>

                            <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-8">
                               <div className="mb-4 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <Calendar className="w-5 h-5 text-blue-500" />
                                     <span className="text-sm font-black text-blue-600 uppercase tracking-widest">Installment Schedule</span>
                                  </div>
                                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold uppercase tracking-widest">
                                     Editable
                                  </span>
                               </div>

                               <InstallmentLedgerEditor
                                  totalPrice={selectedPlan.totalPrice}
                                  advance={Number(advanceOverride) || selectedPlan.advance}
                                  months={selectedPlan.months}
                                  monthlyAmount={
                                     Number(advanceOverride) !== selectedPlan.advance
                                       ? roundUp((selectedPlan.totalPrice - (Number(advanceOverride) || 0)) / selectedPlan.months)
                                       : selectedPlan.monthlyAmount
                                  }
                                  onLedgerChange={(newLedger) => setLedger(newLedger)}
                               />
                            </div>


                          <button 
                            onClick={() => setActiveStep(3)}
                            className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                          >
                            Verify & Proceed
                            <ArrowRight className="w-6 h-6" />
                          </button>
                       </div>
                     )}
                  </div>
                )}

                {/* Step 3: Identity Verification */}
                {activeStep === 3 && (
                   <div className="p-10 animate-in fade-in zoom-in-95 duration-500">
                      <div className="flex flex-col items-center text-center space-y-6 mb-12">
                          <div className="w-24 h-24 bg-red-50 rounded-[3rem] flex items-center justify-center text-red-600 shadow-inner">
                            <Key className="w-12 h-12" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Security Check</h3>
                            <p className="text-gray-400 font-bold max-w-sm mx-auto">We've sent a 6-digit confirmation code to the customer's registered number</p>
                          </div>
                      </div>

                      <div className="max-w-md mx-auto space-y-10">
                         {otpVerified ? (
                            <div className="bg-emerald-500 p-8 rounded-[2.5rem] text-white flex flex-col items-center text-center gap-4 shadow-2xl shadow-emerald-100 animate-in zoom-in">
                               <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                  <CheckCircle2 className="w-10 h-10" />
                               </div>
                               <div>
                                  <h4 className="text-2xl font-black tracking-tight uppercase">User Verified</h4>
                                  <p className="opacity-80 font-bold">Order authorization confirmed successfully</p>
                               </div>
                            </div>
                         ) : (
                            <div className="space-y-8">
                                <div className="space-y-4">
                                   <label className="text-xs font-black text-gray-400 ml-4 uppercase tracking-widest">Verification Phone</label>
                                   <div className="relative group">
                                      <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within:text-red-500 transition-colors" />
                                      <input 
                                        type="text" 
                                        value={phone} 
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-16 pr-6 py-6 bg-gray-50 border-2 border-transparent focus:border-red-500 focus:bg-white rounded-[2rem] font-black text-xl outline-none transition-all shadow-inner"
                                      />
                                      {otpSent && <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-red-100 text-red-600 text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase">Code Active</span>}
                                   </div>
                                   {!otpSent && (
                                     <button 
                                      onClick={sendOTP}
                                      disabled={otpLoading}
                                      className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-red-100 hover:bg-opacity-90 active:scale-95 transition-all"
                                     >
                                      Generate One-Time Password
                                     </button>
                                   )}
                                </div>

                                {otpSent && (
                                   <div className="space-y-4 animate-in slide-in-from-top-4">
                                      <label className="text-xs font-black text-gray-400 ml-4 uppercase tracking-widest text-center block">Enter 6-Digit PIN</label>
                                      <input 
                                        type="text" 
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="......"
                                        className="w-full py-8 bg-gray-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-[2rem] font-black text-5xl tracking-[0.5em] text-center outline-none transition-all shadow-inner placeholder:text-gray-200"
                                      />
                                      <div className="flex gap-4">
                                         <button 
                                          onClick={verifyOTP}
                                          disabled={otpLoading || otp.length < 4}
                                          className="flex-1 py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-100 hover:bg-opacity-90 active:scale-95 transition-all"
                                         >Validate</button>
                                         <button 
                                          onClick={sendOTP}
                                          disabled={otpLoading}
                                          className="px-8 py-5 bg-gray-100 text-gray-600 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all"
                                         >Resend</button>
                                      </div>
                                   </div>
                                )}
                            </div>
                         )}

                         <div className="flex items-center gap-4 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                             <Info className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                             <p className="text-xs text-indigo-800 font-bold leading-relaxed">Identity verification is mandatory for branch releases. The OTP will expire in 10 minutes.</p>
                         </div>
                      </div>
                   </div>
                )}

                {/* Step 4: Face Verification */}
                {activeStep === 4 && (
                  <div className="p-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                              <Camera className="w-6 h-6" />
                           </div>
                           <div>
                              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Advanced Face ID</h3>
                              <p className="text-gray-400 text-sm font-bold">Multiple camera support & image optimization</p>
                           </div>
                        </div>
                        
                        {!faceImage && devices.length > 1 && (
                          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                             <select 
                                value={selectedDeviceId}
                                onChange={(e) => {
                                   setSelectedDeviceId(e.target.value);
                                   startCamera(e.target.value);
                                }}
                                className="bg-transparent border-none outline-none text-xs font-black text-gray-600 px-3 py-1 cursor-pointer"
                             >
                                {devices.map((device, idx) => (
                                   <option key={device.deviceId} value={device.deviceId}>
                                      {device.label || `Camera ${idx + 1}`}
                                   </option>
                                ))}
                             </select>
                             <button 
                                onClick={() => {
                                   const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
                                   const nextIndex = (currentIndex + 1) % devices.length;
                                   const nextDevice = devices[nextIndex];
                                   setSelectedDeviceId(nextDevice.deviceId);
                                   startCamera(nextDevice.deviceId);
                                }}
                                className="p-2 bg-white rounded-xl shadow-sm hover:text-red-500 transition-colors"
                             >
                                <RefreshCcw className="w-4 h-4" />
                             </button>
                          </div>
                        )}
                    </div>

                    <div className="max-w-xl mx-auto space-y-8">
                       <div className="relative aspect-square md:aspect-video bg-gray-900 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group">
                          {faceImage ? (
                            <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                               <img 
                                  src={faceImage} 
                                  alt="Captured" 
                                  className={cn(
                                    "max-w-full max-h-full object-contain transition-all",
                                    isEditing ? "opacity-50 blur-sm" : ""
                                  )} 
                               />
                               
                               {isEditing && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                                     <div className="w-64 h-64 border-4 border-dashed border-red-500 rounded-full flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-red-500/10 rounded-full" />
                                        <Scissors className="w-8 h-8 text-red-500 animate-bounce" />
                                     </div>
                                     <p className="text-red-600 font-black text-sm mt-6 bg-white px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest">Applying Optimization...</p>
                                  </div>
                               )}
                               
                               {!isEditing && (
                                  <div className="absolute top-6 right-6 flex gap-2">
                                     <button 
                                         onClick={handleManualOptimize}
                                         className="p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-white hover:bg-white/40 transition-all shadow-xl"
                                         title="Enhance Photo"
                                      >
                                        <Maximize className="w-5 h-5" />
                                     </button>
                                  </div>
                               )}
                            </div>
                          ) : (
                            <>
                              <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className={cn(
                                  "w-full h-full object-cover transition-all",
                                  isMirrored ? "-scale-x-100" : ""
                                )} 
                              />
                              
                              {/* Face Guide Overlay */}
                              {isCameraActive && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                   <div className="w-64 h-80 border-2 border-white/30 rounded-[100px] relative">
                                      <div className="absolute inset-x-0 top-1/4 h-0.5 bg-red-500/30 animate-pulse" />
                                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-white/50 text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">Align Face Here</div>
                                   </div>
                                </div>
                              )}

                              {!isCameraActive && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                                   <button 
                                      onClick={() => startCamera(selectedDeviceId)}
                                      className="group flex flex-col items-center gap-4"
                                   >
                                      <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-red-500/40 group-hover:scale-110 transition-transform">
                                         <Camera className="w-8 h-8" />
                                      </div>
                                      <span className="text-white font-black uppercase tracking-[0.2em] text-xs">Initialize Camera</span>
                                   </button>
                                </div>
                              )}
                              
                              {/* Quick Actions overlay */}
                              {isCameraActive && (
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-[2rem]">
                                   <button 
                                      onClick={() => setIsMirrored(!isMirrored)}
                                      className={cn(
                                        "p-2.5 rounded-xl transition-all",
                                        isMirrored ? "bg-red-600 text-white" : "text-white/70 hover:bg-white/10"
                                      )}
                                      title="Mirror View"
                                   >
                                      <FlipHorizontal className="w-5 h-5" />
                                   </button>
                                   <div className="w-px h-6 bg-white/20 mx-1" />
                                   <button 
                                      onClick={() => {
                                         const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
                                         const nextIndex = (currentIndex + 1) % devices.length;
                                         setSelectedDeviceId(devices[nextIndex].deviceId);
                                         startCamera(devices[nextIndex].deviceId);
                                      }}
                                      className="p-2.5 text-white/70 hover:bg-white/10 rounded-xl transition-all"
                                      title="Switch Camera"
                                   >
                                      <RefreshCcw className="w-5 h-5" />
                                   </button>
                                </div>
                              )}
                            </>
                          )}
                          <canvas ref={canvasRef} className="hidden" />
                       </div>

                       <div className="flex gap-6">
                          {faceImage ? (
                            <>
                              <button 
                                onClick={() => { 
                                  setFaceImage(null); 
                                  setIsEditing(false);
                                  startCamera(selectedDeviceId); 
                                }}
                                className="flex-1 py-5 bg-white border-2 border-gray-100 text-gray-500 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-gray-100/50"
                              >
                                <RotateCcw className="w-5 h-5" />
                                Retake
                              </button>
                              <button 
                                onClick={() => setActiveStep(5)}
                                disabled={isEditing}
                                className="flex-[1.5] py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-gray-200 hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                              >
                                {isEditing ? (
                                  <>
                                    <RefreshCcw className="w-5 h-5 animate-spin" />
                                    Optimizing...
                                  </>
                                ) : (
                                  <>
                                    Next Step
                                    <ArrowRight className="w-5 h-5" />
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={captureImage}
                                disabled={!isCameraActive}
                                className="flex-[2] py-6 bg-red-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-lg shadow-2xl shadow-red-500/20 hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-4 active:scale-95"
                              >
                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                   <Camera className="w-5 h-5" />
                                </div>
                                Capture Identity
                              </button>
                              
                              <label className="flex-1 py-6 bg-white border-2 border-gray-100 text-gray-400 rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:bg-gray-50 cursor-pointer transition-all flex items-center justify-center gap-3 shadow-lg shadow-gray-100/50">
                                <ImageIcon className="w-6 h-6" />
                                <span className="hidden sm:inline">Gallery</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = async () => {
                                        try {
                                          const rawData = reader.result as string;
                                          setFaceImage(rawData);
                                          setIsEditing(true);
                                          stopCamera();
                                          
                                          const cropped = await autoCrop(rawData);
                                          setFaceImage(cropped);
                                          setTimeout(() => {
                                            setIsEditing(false);
                                          }, 800);
                                        } catch (err) {
                                          setIsEditing(false);
                                          toast.error("Failed to process uploaded image.");
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </>
                          )}
                       </div>

                       <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex flex-col items-center text-center gap-2">
                             <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                                <Maximize className="w-5 h-5" />
                             </div>
                             <p className="text-[10px] text-indigo-800 font-black uppercase">Auto-Crop</p>
                          </div>
                          <div className="p-4 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex flex-col items-center text-center gap-2">
                             <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                                <ShieldCheck className="w-5 h-5" />
                             </div>
                             <p className="text-[10px] text-emerald-800 font-black uppercase">Secure ID</p>
                          </div>
                          <div className="p-4 bg-amber-50/50 rounded-3xl border border-amber-100 flex flex-col items-center text-center gap-2">
                             <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                                <Info className="w-5 h-5" />
                             </div>
                             <p className="text-[10px] text-amber-800 font-black uppercase">High Res</p>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Review & Submit */}
                {activeStep === 5 && (
                  <div className="p-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
                      <div className="flex items-center gap-4 mb-10">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                             <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                             <h3 className="text-2xl font-black text-gray-900 tracking-tight">Final Authorization</h3>
                             <p className="text-gray-400 text-sm font-bold">Everything looks perfect. Ready to release asset.</p>
                          </div>
                      </div>

                      <div className="space-y-6">
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 border border-gray-100 p-6 rounded-[2rem]">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Asset Details</p>
                               <h4 className="font-black text-gray-900 text-lg mb-1">{selectedInventory?.product_name}</h4>
                               <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{selectedInventory?.imei_serial}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 p-6 rounded-[2rem]">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Payment Info</p>
                                <h4 className="font-black text-emerald-600 text-lg mb-1">Rs. {Number(advanceOverride).toLocaleString()} Collected</h4>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">{selectedPlan?.months} Months Installments</p>
                             </div>
                             {faceImage && (
                               <div className="bg-gray-50 border border-gray-100 p-6 rounded-[2rem] md:col-span-2">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Verification Photo</p>
                                  <div className="flex items-center gap-4">
                                     <img src={faceImage} alt="Face" className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-sm" />
                                     <p className="text-xs font-bold text-emerald-600">Snapshot captured and ready for upload</p>
                                  </div>
                               </div>
                             )}
                         </div>

                         <div className="space-y-3">
                            <label className="text-xs font-black text-gray-400 ml-4 uppercase tracking-widest">Internal Delivery Notes</label>
                            <textarea 
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              placeholder="Add any internal branch notes or physical inspection results here..."
                              className="w-full h-40 p-8 bg-white border-2 border-gray-100 focus:border-indigo-500 rounded-[2.5rem] font-bold outline-none transition-all resize-none shadow-sm"
                            />
                         </div>

                         <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full py-8 bg-red-600 text-white rounded-[2.5rem] font-black text-xl uppercase tracking-[0.3em] shadow-2xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-6 group"
                         >
                            {isSubmitting ? (
                              <div className="size-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>Initiate Delivery</span>
                                <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
                              </>
                            )}
                         </button>
                      </div>
                  </div>
                )}
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4 sticky top-10 space-y-8">
           
           {/* Order Recap */}
           <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-100 space-y-8">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 overflow-hidden relative">
                    <ShoppingBag className="w-7 h-7 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Original Request</p>
                    <h3 className="font-black text-gray-900 leading-tight line-clamp-2">{order?.product_name}</h3>
                 </div>
              </div>

              <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-bold uppercase tracking-tighter">Customer</span>
                    <span className="font-black text-gray-900">{order?.customer_name}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 font-bold uppercase tracking-tighter">Budget Price</span>
                    <span className="font-black text-red-600 uppercase">Rs. {order?.total_amount?.toLocaleString()}</span>
                 </div>
                 <div className="pt-4 border-t border-gray-100 flex gap-3 text-xs text-gray-400 font-bold leading-relaxed italic">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-300" />
                    Branch user must physically inspect the product and verify IMEI before release.
                 </div>
              </div>

              {selectedInventory && (
                <div className="animate-in fade-in zoom-in-95 space-y-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Identified</p>
                   <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100 flex items-center gap-4">
                      <Smartphone className="w-8 h-8 text-emerald-600" />
                      <div>
                         <p className="text-sm font-black text-emerald-900">{selectedInventory.imei_serial}</p>
                         <p className="text-[10px] font-black text-emerald-600/70 uppercase">{selectedInventory.color_variant}</p>
                      </div>
                   </div>
                </div>
              )}
           </div>

           {/* Security Warning */}
           <div className="bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-3 text-blue-400">
                    <ShieldCheck className="w-6 h-6" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Compliance Check</span>
                 </div>
                 <h4 className="text-xl font-black text-white leading-tight">Secure Handover Protocol</h4>
                 <p className="text-xs text-gray-400 font-bold leading-relaxed">
                    Once the delivery is finalized, a legal installment contract is sent via WhatsApp. branch user confirms that all physical documents are signed.
                 </p>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}

// Custom Icon aliases for the UI
function स्मार्टफोन(props: any) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
      <path d="M12 18h.01"/>
    </svg>
  );
}
