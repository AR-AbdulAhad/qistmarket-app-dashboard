"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import type { PropsWithChildren } from "react";
import { AuthProvider } from "../../../contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import io, { Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

let socket: Socket | null = null;

export default function Layout({ children }: PropsWithChildren) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = Cookies.get("auth_token");
    if (!token) return;

    if (socket && socket.connected) return;

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "https://qistmarket-software-backend.onrender.com";

    socket = io(backendUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
      socket?.emit("join_admin_notifications", token);
    });

    socket.on("joined_admin_room", (data) => {
      if (data.success) {
        console.log("Successfully joined admin notifications room");
      }
    });

    socket.on("new_notification", (notif: any) => {
      toast.success(
        <div className="flex flex-col gap-1">
          <strong>{notif.title}</strong>
          <span>{notif.message}</span>
        </div>,
      );
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
        console.log("Socket disconnected on layout unmount");
      }
    };
  }, []);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar />

            <div className="w-full bg-gray-2 dark:bg-[#000000]">
              <Header />

              <main className="mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}