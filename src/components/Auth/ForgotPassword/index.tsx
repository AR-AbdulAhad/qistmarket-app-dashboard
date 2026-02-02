"use client";

import {
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@/assets/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InputGroup from "../../FormElements/InputGroup";
import { Checkbox } from "../../FormElements/checkbox";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { ChevronLeft } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ForgotPassword() {
  const router = useRouter();

  const [data, setData] = useState({
    identifier: "",
    phone: "",
    
  });

  const [showPassword, setShowPassword] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

   

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: data.identifier,
          phone: data.phone,
         
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message);
      }

      toast.success(result.message);
     
      router.push("/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
        

        <Link href="/login" className="hover:text-[#ff3d3d] transition flex">
         <ChevronLeft/> Back
        </Link>
      </div>
    <form onSubmit={handleSubmit}>
      <InputGroup
        type="text"
        label="Email, Username or CNIC"
        className="mb-4 [&_input]:py-[15px] [&_input]:pr-12"
        placeholder="Email, Username, CNIC or Phone"
        name="identifier"
        handleChange={handleChange}
        value={data.identifier}
        icon={<UserIcon />}
      />

      <div className="relative">
        <InputGroup
          type={"number"}
          label="Phone"
          className="mb-5 [&_input]:py-[15px] [&_input]:pr-12"
          placeholder="Your Phone"
          name="phone"
          handleChange={handleChange}
          value={data.phone}
        />

       
      </div>

      

      <div className="mb-4.5">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff3d3d] p-4 font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Sending Verification Email ' : 'Proceed'}
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
          )}
        </button>
      </div>
    </form>
    </>
  );
}