"use client";

import {
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@/assets/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InputGroup from "../FormElements/InputGroup";
import { Checkbox } from "../FormElements/checkbox";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function SigninWithPassword() {
  const router = useRouter();

  const [data, setData] = useState({
    identifier: "",
    password: "",
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!deviceId) {
      toast.error("Device information is loading. Please try again in a moment.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/login/web`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: data.identifier,
          password: data.password,
          "device-id": deviceId,
          remember: data.remember,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message);
      }

      toast.success(result.message);
      Cookies.set("auth_token", result.token, {
        expires: data.remember ? 90 : 30,
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
    <form onSubmit={handleSubmit}>
      <InputGroup
        type="text"
        label="Email, Username, CNIC or Phone"
        className="mb-4 [&_input]:py-[15px] [&_input]:pr-12"
        placeholder="Email, Username, CNIC or Phone"
        name="identifier"
        handleChange={handleChange}
        value={data.identifier}
        icon={<UserIcon />}
      />

      <div className="relative">
        <InputGroup
          type={showPassword ? "text" : "password"}
          label="Password"
          className="mb-5 [&_input]:py-[15px] [&_input]:pr-12"
          placeholder="Your password"
          name="password"
          handleChange={handleChange}
          value={data.password}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[37px] -translate-y-1/2 transform text-gray-500 hover:text-gray-800 focus:outline-none"
          style={{ marginTop: "28px" }}
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between gap-2 py-2 font-medium">
        <Checkbox
          label="Remember me"
          name="remember"
          withIcon="check"
          minimal
          radius="md"
          onChange={(e) =>
            setData({
              ...data,
              remember: e.target.checked,
            })
          }
        />

        <Link href="/auth/forgot-password" className="hover:text-[#ff3d3d] transition">
          Forgot Password?
        </Link>
      </div>

      <div className="mb-4.5">
        <button
          type="submit"
          disabled={loading || !deviceId}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff3d3d] p-4 font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Signing In' : 'Sign In'}
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
          )}
        </button>
      </div>
    </form>
  );
}