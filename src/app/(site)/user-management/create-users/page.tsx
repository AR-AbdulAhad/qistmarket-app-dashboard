'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Monitor, Package, Eye, EyeOff } from 'lucide-react';
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const CreateUsers: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    phone: '',
    role_id: '',
    cnic: '',
  });
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fullNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const cnicRef = useRef<HTMLInputElement>(null);
  const roleSectionRef = useRef<HTMLDivElement>(null);

  const roles = [
    {
      id: 1,
      name: 'Verification Officer (VO)',
      platform: 'mobile',
      icon: Smartphone,
      description: 'View assigned cases, perform visits, upload photos/docs, voice notes, start/end day tracking, drafts and also Create and manage new orders'
    },
    {
      id: 2,
      name: 'Delivery Agent (DA)',
      platform: 'mobile',
      icon: Smartphone,
      description: 'View assigned deliveries, collect payment (cash/online), OTP confirmation, upload delivery photos with tags, pickup/returns handling and also Create and manage new orders'
    },
    {
      id: 3,
      name: 'Recovery Officer (RO)',
      platform: 'mobile',
      icon: Smartphone,
      description: 'Outdoor recovery visits, payment collection, blacklist tagging, location & proof capture and also Create and manage new orders'
    },
    {
      id: 4,
      name: 'Admin',
      platform: 'web',
      icon: Monitor,
      description: 'Assign cases, manage officers, approve/reject verifications, live map, reports, export and also Create and manage new orders'
    },
    {
      id: 8,
      name: 'Sales Officer (SO)',
      platform: 'web',
      icon: Monitor,
      description: 'Create and manage new orders from various channels (website, WhatsApp, branch, referral)'
    },
    {
      id: 5,
      name: 'Branch User',
      platform: 'web',
      icon: Monitor,
      description: 'Manage branch balances, confirm OTP transfers, view stock & expenses, reconcile receipts'
    },
    // {
    //   id: 6,
    //   name: 'Stock Manager',
    //   platform: 'web',
    //   icon: Package,
    //   description: 'Manage inventory, track stock levels, handle warehouse operations'
    // },
    {
      id: 9,
      name: 'Form Analyzer',
      platform: 'web',
      icon: Package,
      description: 'Analyze and manage form data and submissions'
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+92|0)?[0-9]{10}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Phone number must be a valid Pakistani number (e.g., 03001234567)';
    }
    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC is required';
    } else if (!/^\d{5}-\d{7}-\d{1}$|^\d{13}$/.test(formData.cnic.replace(/[-\s]/g, ''))) {
      newErrors.cnic = 'CNIC must be in format 42101XXXXXXXXX or 42101-XXXXXXX-X';
    }
    if (!formData.role_id) newErrors.role_id = 'Please select a role';

    if (formData.email.trim()) {
      if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
        newErrors.email = 'Email format is invalid';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      let elementToScroll: HTMLElement | null = null;

      switch (firstErrorKey) {
        case 'fullName':
          elementToScroll = fullNameRef.current;
          break;
        case 'username':
          elementToScroll = usernameRef.current;
          break;
        case 'phone':
          elementToScroll = phoneRef.current;
          break;
        case 'cnic':
          elementToScroll = cnicRef.current;
          break;
        case 'role_id':
          elementToScroll = roleSectionRef.current;
          break;
        default:
          break;
      }

      if (elementToScroll) {
        elementToScroll.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (elementToScroll as HTMLInputElement)?.focus?.();
      }
    }
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      if (!token) {
        toast.error("Unauthorized: No token found");
        return;
      }
      const payload: any = {
        full_name: formData.fullName.trim(),
        username: formData.username.trim(),
        phone: formData.phone.trim(),
        role_id: Number(formData.role_id),
        cnic: formData.cnic.trim().replace(/[-\s]/g, ''),
      };

      if (formData.email.trim()) {
        payload.email = formData.email.trim();
      }

      const response = await fetch(`${BACKEND_URL}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message);
      }

      const result = await response.json();
      toast.success(result.message);

      setFormData({
        fullName: '',
        email: '',
        username: '',
        phone: '',
        role_id: '',
        cnic: '',
      });
      setErrors({});

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      fullName: '',
      email: '',
      username: '',
      phone: '',
      role_id: '',
      cnic: '',
    });
    setErrors({});
  };

  const selectedRole = roles.find(r => r.id === Number(formData.role_id));

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[970px]">
        <Breadcrumb pageName="Create New User" />
        <div className="bg-white rounded-lg shadow-sm p-8">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fullNameRef}
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-[1.5px] bg-transparent outline-none transition focus:border-[#ff3d3d] ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-[1.5px] bg-transparent outline-none transition focus:border-[#ff3d3d] ${errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="user@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={usernameRef}
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-[1.5px] bg-transparent outline-none transition focus:border-[#ff3d3d] ${errors.username ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter username"
                  />
                  {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={phoneRef}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-[1.5px] bg-transparent outline-none transition focus:border-[#ff3d3d] ${errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="03001234567"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNIC <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={cnicRef}
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-[1.5px] bg-transparent outline-none transition focus:border-[#ff3d3d] ${errors.cnic ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="42101XXXXXXXXX"
                  />
                  {errors.cnic && <p className="text-red-500 text-sm mt-1">{errors.cnic}</p>}
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div ref={roleSectionRef} className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Role & Access</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Role <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    return (
                      <label
                        key={role.id}
                        className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${Number(formData.role_id) === role.id
                          ? 'border-[#ff3d3d] bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="role_id"
                          value={role.id}
                          checked={Number(formData.role_id) === role.id}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-5 h-5 ${Number(formData.role_id) === role.id ? 'text-[#ff3d3d]' : 'text-gray-500'}`} />
                            <span className="font-semibold text-gray-900">{role.name}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${role.platform === 'mobile'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                            }`}>
                            {role.platform === 'mobile' ? 'Mobile App' : 'Web Dashboard'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.role_id && <p className="text-red-500 text-sm mt-2">{errors.role_id}</p>}
              </div>
            </div>

            {/* OTP Warning/Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Dashboard users will log in via OTP sent to their WhatsApp or Email. No password setup is required.
              </p>
            </div>

            {/* Selected Role Summary */}
            {selectedRole && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Selected Role Summary</h3>
                <div className="flex items-start gap-3">
                  {React.createElement(selectedRole.icon, { className: 'w-5 h-5 text-red-600 mt-0.5' })}
                  <div>
                    <p className="font-medium text-red-900">{selectedRole.name}</p>
                    <p className="text-sm text-red-700 mt-1">{selectedRole.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 bg-[#ff3d3d] text-white py-3 px-6 rounded-lg font-semibold hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating User' : 'Create User'}
                {loading && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
                )}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
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

export default CreateUsers;