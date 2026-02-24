'use client'

import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Globe, MessageSquare, Building, Users } from 'lucide-react';
import toast from "react-hot-toast";
import Cookies from "js-cookie";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const CreateOrders: React.FC = () => {
  const [formData, setFormData] = useState({
    customer_name: '',
    whatsapp_number: '',
    address: '',
    city: 'Karachi', // Default city
    area: '',
    zone: '',
    block: '',
    street: '',
    house_no: '',
    gender: '',
    marital_status: '',
    residential_type: '',
    product_name: '',
    total_amount: '',
    advance_amount: '',
    monthly_amount: '',
    months: '',
    channel: '',
  });

  const [isManualAddress, setIsManualAddress] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLSelectElement>(null);
  const areaRef = useRef<HTMLSelectElement>(null);
  const genderRef = useRef<HTMLSelectElement>(null);
  const maritalRef = useRef<HTMLSelectElement>(null);
  const residentialRef = useRef<HTMLSelectElement>(null);
  const channelRef = useRef<HTMLDivElement>(null);

  // ────────────────────────────────────────────────
  // Hardcoded data (same as your original)
  // ────────────────────────────────────────────────

  const citiesData: Record<string, string[]> = {
    Karachi: [
      "Abbas Town",
      "Abdullah Haroon Road",
      "Abid Town",
      "Abu Zar Ghaffari",
      "Abul Hassan Isphani Road",
      "Abul Isphani Road",
      "Agra Taj Colony",
      "Airport",
      "Akhtar Colony",
      "Alamgir Society",
      "Ameeruddin Memon Colony",
      "Ancholi",
      "Askari 1",
      "Askari 2",
      "Askari 3",
      "Askari 4",
      "Bahria Town Karachi",
      "Baldia Town",
      "Battery Road",
      "Buffer Zone",
      "Cantonment",
      "Clifton",
      "DHA",
      "Federal B Area",
      "Gadap Town",
      "Gulistan-e-Johar",
      "Gulshan-e-Iqbal",
      "Jamshed Road",
      "Jinnah Colony",
      "Korangi",
      "Liaquatabad",
      "Malir",
      "Nazimabad",
      "North Karachi",
      "North Nazimabad",
      "Orangi Town",
      "PECHS",
      "Saddar",
      "Shah Faisal Colony",
      "Sharafi Goth",
      "Saudabad",
      "Surjani Town",
    ]
  };

  const products = [
    {
      id: 978,
      name: "Twin Tub Washing Machine DW-10600",
      brand: "Qist Market",
      price: 51000,
      ProductInstallments: [
        { id: 4906, advance: 20400, monthlyAmount: 12200, months: 3, totalPrice: 57000, isActive: true },
        { id: 4907, advance: 17850, monthlyAmount: 7500, months: 6, totalPrice: 62850, isActive: true },
        { id: 4908, advance: 15300, monthlyAmount: 5800, months: 9, totalPrice: 67500, isActive: true },
        { id: 4909, advance: 12750, monthlyAmount: 4900, months: 12, totalPrice: 71550, isActive: true },
        { id: 4910, advance: 12750, monthlyAmount: 2900, months: 24, totalPrice: 82350, isActive: true },
      ],
    },
    {
      id: 979,
      name: "Smart LED TV 43 inch",
      brand: "Qist Market",
      price: 65000,
      ProductInstallments: [
        { id: 5001, advance: 26000, monthlyAmount: 15600, months: 3, totalPrice: 72800, isActive: true },
        { id: 5002, advance: 22750, monthlyAmount: 9500, months: 6, totalPrice: 79750, isActive: true },
        { id: 5003, advance: 19500, monthlyAmount: 7400, months: 9, totalPrice: 86100, isActive: true },
      ],
    },
    {
      id: 980,
      name: "Refrigerator 300L Double Door",
      brand: "Qist Market",
      price: 85000,
      ProductInstallments: [
        { id: 5101, advance: 34000, monthlyAmount: 20400, months: 3, totalPrice: 95200, isActive: true },
        { id: 5102, advance: 29750, monthlyAmount: 12400, months: 6, totalPrice: 104150, isActive: true },
      ],
    },
  ];

  const channels = [
    { id: 'website', name: 'Website', icon: Globe, description: 'Orders placed through the official website' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, description: 'Orders received via WhatsApp messages' },
    { id: 'branch', name: 'Branch', icon: Building, description: 'In-person orders at physical branches' },
    { id: 'referral', name: 'Referral', icon: Users, description: 'Orders from customer referrals or repeats' },
  ];

  const genderOptions = ['Male', 'Female', 'Unidentified'];
  const maritalOptions = ['Single', 'Married', 'Divorced', 'Widowed'];
  const residentialOptions = ['Own', 'Rented', 'With Family'];

  const areas = formData.city && citiesData[formData.city] ? citiesData[formData.city] : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSelectedPlan(null);
    setFormData(prev => ({ ...prev, product_name: product.name }));
  };

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setFormData(prev => ({
      ...prev,
      total_amount: plan.totalPrice.toString(),
      advance_amount: plan.advance.toString(),
      monthly_amount: plan.monthlyAmount.toString(),
      months: plan.months.toString(),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name.trim()) newErrors.customer_name = 'Customer name is required';
    if (!formData.whatsapp_number.trim() || !/^(\+92|0)?[0-9]{10}$/.test(formData.whatsapp_number.replace(/\s+/g, ''))) {
      newErrors.whatsapp_number = 'Valid WhatsApp number is required';
    }

    if (isManualAddress) {
      if (!formData.address.trim()) newErrors.address = 'Address is required';
    } else {
      if (!formData.zone) newErrors.zone = 'Zone is required';
      if (!formData.area) newErrors.area = 'Area is required';
    }

    if (!formData.city) newErrors.city = 'City is required';
    if (formData.city && !formData.area) newErrors.area = 'Area is required';

    // New fields - making them required (as per previous backend validation)
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.marital_status) newErrors.marital_status = 'Marital status is required';
    if (!formData.residential_type) newErrors.residential_type = 'Residential type is required';

    if (!selectedProduct) newErrors.product = 'Product is required';
    if (!selectedPlan) newErrors.plan = 'Installment plan is required';
    if (!formData.channel) newErrors.channel = 'Channel is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      if (!token) throw new Error("No authentication token found");

      // Construct address if not manual
      let submissionAddress = formData.address.trim();
      if (!isManualAddress) {
        const parts = [
          formData.house_no,
          formData.street,
          formData.block,
          formData.area,
          formData.zone
        ].filter(p => p && p.trim() !== '');
        submissionAddress = parts.join(', ');
      }

      const payload = {
        customer_name: formData.customer_name.trim(),
        whatsapp_number: formData.whatsapp_number.trim(),
        address: submissionAddress,
        city: formData.city,
        area: formData.area,
        zone: formData.zone,
        block: formData.block,
        street: formData.street,
        house_no: formData.house_no,
        gender: formData.gender,
        marital_status: formData.marital_status,
        residential_type: formData.residential_type,
        product_name: formData.product_name.trim(),
        total_amount: formData.total_amount,
        advance_amount: formData.advance_amount,
        monthly_amount: formData.monthly_amount,
        months: formData.months,
        channel: formData.channel,
      };

      const response = await fetch(`${BACKEND_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error?.message || 'Failed to create order');

      toast.success(`Order created successfully! Token: ${result.data.order.token_number}`);

      // Reset form
      setFormData({
        customer_name: '', whatsapp_number: '', address: '', city: 'Karachi', area: '',
        zone: '', block: '', street: '', house_no: '',
        gender: '', marital_status: '', residential_type: '',
        product_name: '', total_amount: '', advance_amount: '', monthly_amount: '', months: '', channel: ''
      });
      setIsManualAddress(false);
      setSelectedProduct(null);
      setSelectedPlan(null);
      setErrors({});

    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[970px]">

        <div className="bg-white rounded-xl shadow-sm p-8">

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ────────────────────────────────────────────────
                Customer Information (with new fields)
            ──────────────────────────────────────────────── */}
            <section className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Customer Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name <span className="text-red-600">*</span></label>
                  <input
                    ref={nameRef}
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition ${errors.customer_name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter full name"
                  />
                  {errors.customer_name && <p className="text-red-600 text-sm mt-1">{errors.customer_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number <span className="text-red-600">*</span></label>
                  <input
                    ref={whatsappRef}
                    type="tel"
                    name="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition ${errors.whatsapp_number ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="03001234567"
                  />
                  {errors.whatsapp_number && <p className="text-red-600 text-sm mt-1">{errors.whatsapp_number}</p>}
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Address Information <span className="text-red-600">*</span></label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={isManualAddress}
                        onChange={(e) => setIsManualAddress(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      Manual Entry
                    </label>
                  </div>

                  {isManualAddress ? (
                    <input
                      ref={addressRef}
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Full Address (House #, Street, Block, Area, etc.)"
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <select
                          name="zone"
                          value={formData.zone}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition ${errors.zone ? 'border-red-500' : 'border-gray-300'}`}
                        >
                          <option value="">Select Zone</option>
                          <option value="Central">Central</option>
                          <option value="East">East</option>
                          <option value="West">West</option>
                          <option value="South">South</option>
                          <option value="Malir">Malir</option>
                          <option value="Korangi">Korangi</option>
                        </select>
                        {errors.zone && <p className="text-red-600 text-sm mt-1">{errors.zone}</p>}
                      </div>
                      <div>
                        <select
                          name="area"
                          value={formData.area}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition ${errors.area ? 'border-red-500' : 'border-gray-300'}`}
                        >
                          <option value="">Select Area</option>
                          {areas.map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                        {errors.area && <p className="text-red-600 text-sm mt-1">{errors.area}</p>}
                      </div>
                      <div>
                        <input
                          type="text"
                          name="block"
                          value={formData.block}
                          onChange={handleChange}
                          placeholder="Block / Sector"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          placeholder="Street"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          name="house_no"
                          value={formData.house_no}
                          onChange={handleChange}
                          placeholder="House No / Appartment #"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition"
                        />
                      </div>
                    </div>
                  )}
                  {errors.address && isManualAddress && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-600">*</span></label>
                  <select
                    ref={cityRef}
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select City</option>
                    {Object.keys(citiesData).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area <span className="text-red-600">*</span></label>
                  <select
                    ref={areaRef}
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    disabled={!formData.city}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition disabled:bg-gray-100 ${errors.area ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Area</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  {errors.area && <p className="text-red-600 text-sm mt-1">{errors.area}</p>}
                </div>

                {/* ── New fields inserted here ── */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender <span className="text-red-600">*</span></label>
                  <select
                    ref={genderRef}
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status <span className="text-red-600">*</span></label>
                  <select
                    ref={maritalRef}
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition ${errors.marital_status ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Status</option>
                    {maritalOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.marital_status && <p className="text-red-600 text-sm mt-1">{errors.marital_status}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Residential Type <span className="text-red-600">*</span></label>
                  <select
                    ref={residentialRef}
                    name="residential_type"
                    value={formData.residential_type}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition ${errors.residential_type ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Type</option>
                    {residentialOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.residential_type && <p className="text-red-600 text-sm mt-1">{errors.residential_type}</p>}
                </div>
              </div>
            </section>

            {/* ────────────────────────────────────────────────
                Product & Installment Plan (original style)
            ──────────────────────────────────────────────── */}
            <section className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Product & Installment Plan</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Product <span className="text-red-600">*</span></label>
                <select
                  name="product_name"
                  value={formData.product_name}
                  onChange={(e) => {
                    const prod = products.find(p => p.name === e.target.value);
                    if (prod) handleProductSelect(prod);
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition ${errors.product ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Product</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.name}>
                      {p.name} – {p.brand} ({p.price.toLocaleString()} PKR)
                    </option>
                  ))}
                </select>
                {errors.product && <p className="text-red-600 text-sm mt-1">{errors.product}</p>}
              </div>

              {selectedProduct && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Installment Plan <span className="text-red-600">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedProduct.ProductInstallments
                      ?.filter((p: any) => p.isActive)
                      .map((plan: any) => (
                        <label
                          key={plan.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPlan?.id === plan.id
                            ? 'border-red-500 bg-red-50 shadow-sm'
                            : 'border-gray-200 hover:border-red-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="plan"
                            checked={selectedPlan?.id === plan.id}
                            onChange={() => handlePlanSelect(plan)}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <div className="font-semibold text-lg">{plan.months} Months</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Advance: <span className="font-medium">{plan.advance.toLocaleString()}</span>
                              <br />
                              Monthly: <span className="font-medium">{plan.monthlyAmount.toLocaleString()}</span>
                              <br />
                              Total: <span className="font-medium">{plan.totalPrice.toLocaleString()}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                  {errors.plan && <p className="text-red-600 text-sm mt-2">{errors.plan}</p>}
                </div>
              )}
            </section>

            {/* ────────────────────────────────────────────────
                Order Channel (original style)
            ──────────────────────────────────────────────── */}
            <section ref={channelRef} className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Channel <span className="text-red-600">*</span></h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {channels.map(ch => {
                  const Icon = ch.icon;
                  return (
                    <label
                      key={ch.id}
                      className={`p-5 border-2 rounded-xl cursor-pointer transition-all text-center ${formData.channel === ch.id
                        ? 'border-red-500 bg-red-50 shadow-sm'
                        : 'border-gray-200 hover:border-red-300 hover:shadow'
                        }`}
                    >
                      <input
                        type="radio"
                        name="channel"
                        value={ch.id}
                        checked={formData.channel === ch.id}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <Icon className="w-8 h-8 mx-auto mb-3 text-gray-600" />
                      <div className="font-semibold">{ch.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{ch.description}</div>
                    </label>
                  );
                })}
              </div>
              {errors.channel && <p className="text-red-600 text-sm mt-2">{errors.channel}</p>}
            </section>

            {/* ────────────────────────────────────────────────
                Actions (original button sizes & layout)
            ──────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-3.5 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    Creating...
                  </>
                ) : 'Create Order'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormData({
                    customer_name: '', whatsapp_number: '', address: '', city: 'Karachi', area: '',
                    zone: '', block: '', street: '', house_no: '',
                    gender: '', marital_status: '', residential_type: '',
                    product_name: '', total_amount: '', advance_amount: '', monthly_amount: '', months: '', channel: ''
                  });
                  setSelectedProduct(null);
                  setSelectedPlan(null);
                  setErrors({});
                }}
                className="px-8 py-3.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrders;