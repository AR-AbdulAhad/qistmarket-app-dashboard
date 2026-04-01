"use client";

import { useCallback, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import OrderList from "@/components/OrderList/OrderList";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export default function CsrWebsiteOrdersPage() {
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRowSelectionChange = useCallback((selected: any[]) => {
    setSelectedOrders(selected.map((order) => order.id));
  }, []);

  const takeSelectedOrders = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Select at least one order to take.");
      return;
    }
    setLoading(true);
    try {
      const token = Cookies.get("auth_token");
      await Promise.all(
        selectedOrders.map(async (orderId) => {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/orders/${orderId}/take`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) {
            const json = await res.json();
            throw new Error(json.message || "Unable to take order");
          }
        })
      );
      toast.success("Selected orders were taken successfully.");
      setSelectedOrders([]);
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to take orders.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Breadcrumb pageName="Website Orders" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Website Orders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">All website order requests appear here for CSR pickup, area review, and verification dispatch.</p>
        </div>
        <button
          type="button"
          onClick={takeSelectedOrders}
          disabled={selectedOrders.length === 0 || loading}
          className="inline-flex items-center justify-center rounded-lg bg-[#ff3d3d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? "Taking orders..." : `Take selected (${selectedOrders.length})`}
        </button>
      </div>

      <OrderList
        forcedChannel="website"
        hideSelection={false}
        onRowSelectionChange={handleRowSelectionChange}
      />
    </div>
  );
}
