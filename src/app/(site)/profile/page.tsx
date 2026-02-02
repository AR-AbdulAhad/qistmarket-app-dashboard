"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CameraIcon } from "./_components/icons";
import Cookies from "js-cookie";
import { useAuth } from "../../../../contexts/AuthContext";
import { jwtDecode } from "jwt-decode";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface User {
  id: number;
  full_name: string;
  email: string | null;
  username: string;
  cnic: string | null;
  phone: string | null;
  role_id: number;
  role: string;
  device_id: string | null;
  image?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  permissions: any[];
}

export default function ProfilePage() {
  const { user, loading: authLoading, setUser } = useAuth();

  const [data, setData] = useState({
    full_name: "",
    profilePhoto: "/images/user/user-03.png",
    coverPhoto: "/images/cover/cover-01.png",
  });

  const [fileProfile, setFileProfile] = useState<File | null>(null);
  const [fileCover, setFileCover] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setData({
        full_name: user.full_name || "",
        profilePhoto: user.image || "/images/user/user-03.png",
        coverPhoto: user.coverImage || "/images/cover/cover-01.png",
      });
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (name === "profilePhoto") {
      setData((prev) => ({ ...prev, profilePhoto: URL.createObjectURL(file) }));
      setFileProfile(file);
    } else if (name === "coverPhoto") {
      setData((prev) => ({ ...prev, coverPhoto: URL.createObjectURL(file) }));
      setFileCover(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = Cookies.get("auth_token");
    if (!token) return toast.error("Authentication required");

    setSaving(true);
    const formData = new FormData();
    formData.append("full_name", data.full_name);
    if (fileProfile) formData.append("image", fileProfile);
    if (fileCover) formData.append("coverImage", fileCover);

    try {
      const res = await fetch(`${BACKEND_URL}/api/user/update`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();

        if (result.token) {
          Cookies.set("auth_token", result.token, { expires: 7, path: "/" });
          const decoded = jwtDecode<User>(result.token);
          setUser(decoded);
        }
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="text-center py-10">Loading...</div>;

  if (!user) return null;

  console.log("User Data:", user);

  return (
    <div className="mx-auto w-full max-w-[970px]">
      <Breadcrumb pageName="Profile" />

      <form onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
          {/* Cover Photo */}
          <div className="relative z-20 h-35 md:h-65">
            <Image
              src={data.coverPhoto}
              alt="cover"
              fill
              className="object-cover object-center rounded-t-[10px]"
            />
            <div className="absolute bottom-1 right-1 z-10 xsm:bottom-4 xsm:right-4">
              <label
                htmlFor="coverPhoto"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#ff3d3d] px-[15px] py-[5px] text-body-sm font-medium text-white hover:bg-opacity-90"
              >
                <CameraIcon />
                <span>Edit</span>
                <input
                  type="file"
                  name="coverPhoto"
                  id="coverPhoto"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept="image/png, image/jpg, image/jpeg"
                />
              </label>
            </div>
          </div>

          {/* Profile Section */}
          <div className="px-4 pb-6 text-center lg:pb-8 xl:pb-11.5">
            <div className="relative z-30 mx-auto -mt-22 h-30 w-full max-w-30 rounded-full bg-white/20 p-1 backdrop-blur sm:h-44 sm:max-w-[176px] sm:p-3">
              <div className="relative drop-shadow-2">
                <Image
                  src={data.profilePhoto}
                  width={176}
                  height={176}
                  alt="profile"
                  className="rounded-full object-cover"
                />
                <label
                  htmlFor="profilePhoto"
                  className="absolute bottom-0 right-0 flex size-8.5 cursor-pointer items-center justify-center rounded-full bg-[#ff3d3d] text-white hover:bg-opacity-90 sm:bottom-2 sm:right-2"
                >
                  <CameraIcon />
                  <input
                    type="file"
                    name="profilePhoto"
                    id="profilePhoto"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/png, image/jpg, image/jpeg"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="mb-1 text-heading-6 font-bold text-dark dark:text-white">
                {data.full_name || user.full_name}
              </h3>
              <p className="font-medium">{user.role || "User"}</p>

              <div className="mx-auto max-w-[720px] mt-5">
                <h4 className="font-medium text-dark dark:text-white">About Me</h4>
                <p className="mt-4">
                  {user.bio || "No bio added yet. Edit your profile to add a description."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#ff3d3d] px-8 py-3 font-medium text-white hover:bg-opacity-90 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}