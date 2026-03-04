"use client";

import {
  UserIcon,
} from "@/assets/icons";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InputGroup from "../FormElements/InputGroup";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { KeyIcon } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function SigninWithOTP() {
  const router = useRouter();

  const [data, setData] = useState({
    identifier: "",
    otp: "",
    remember: false,
  });

  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [deviceId, setDeviceId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateDeviceId = () => {
      let id = localStorage.getItem("device_id");

      if (!id) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.textBaseline = "top";
          ctx.font = "14px Arial";
          ctx.fillStyle = "#f60";
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = "#069";
          ctx.fillText("Device Fingerprint 😊", 2, 15);
        }

        const fingerprintData = [
          navigator.userAgent,
          navigator.language || navigator.languages?.[0],
          screen.width + "x" + screen.height,
          screen.colorDepth,
          new Date().getTimezoneOffset(),
          !!navigator.hardwareConcurrency ? navigator.hardwareConcurrency : "",
          canvas.toDataURL ? canvas.toDataURL() : "",
        ].join("|||");

        let hash = 0;
        for (let i = 0; i < fingerprintData.length; i++) {
          const char = fingerprintData.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }

        id = "web-" + Math.abs(hash).toString(36).substring(0, 14).padEnd(14, "0");
        localStorage.setItem("device_id", id);
      }

      setDeviceId(id);
    };

    generateDeviceId();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.identifier) {
      toast.error("Please enter your email, username, CNIC or phone.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/login/web/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.identifier }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || "Failed to send OTP.");

      toast.success(result.message || "OTP sent successfully.");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.otp) {
      toast.error("Please enter the 5-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/login/web/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: data.identifier,
          otp: data.otp,
          "device-id": deviceId,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || "Login failed.");

      toast.success(result.message);
      Cookies.set("auth_token", result.token, {
        expires: 30, // Default to 30 days
        path: "/",
      });
      router.push("/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === "identifier" ? (
        <form onSubmit={handleSendOTP}>
          <InputGroup
            type="text"
            label="Phone Number or Email"
            className="mb-6 [&_input]:py-[15px] [&_input]:pr-12"
            placeholder="Phone Number or Email"
            name="identifier"
            handleChange={handleChange}
            value={data.identifier}
            icon={<UserIcon />}
          />

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff3d3d] p-4 font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "Continue"}
            {loading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <p className="mb-6 text-sm text-gray-600">
            OTP has been sent to <strong>{data.identifier}</strong>. Please enter the 5-digit code below.
          </p>

          <InputGroup
            type="text"
            label="Verification Code"
            className="mb-6 [&_input]:py-[15px] [&_input]:pr-12"
            placeholder="Enter 5-digit OTP"
            name="otp"
            handleChange={handleChange}
            value={data.otp}
            icon={<KeyIcon className="h-5 w-5" />}
          />

          <div className="mb-4.5 flex gap-4">
            <button
              type="button"
              onClick={() => setStep("identifier")}
              className="flex flex-1 items-center justify-center rounded-lg border border-stroke bg-white p-4 font-medium text-dark transition hover:bg-gray-50 focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] flex items-center justify-center gap-2 rounded-lg bg-[#ff3d3d] p-4 font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Login"}
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="text-[#ff3d3d] hover:underline font-medium disabled:opacity-50"
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
