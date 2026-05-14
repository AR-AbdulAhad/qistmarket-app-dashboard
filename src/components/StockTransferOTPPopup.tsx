"use client";

import React, { useState, useEffect } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import { useAuth } from "../../contexts/AuthContext";
import { Truck, Store, KeyRound, CheckCircle2, X } from "lucide-react";
import { toast } from "react-hot-toast";

export const StockTransferOTPPopup = () => {
    const { socket } = useNotifications();
    const { user } = useAuth();
    const [incomingTransfer, setIncomingTransfer] = useState<any>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!socket || !user) return;

        // Join outlet room if user belongs to an outlet
        if (user.outlet_id) {
            socket.emit("join_room", `outlet_${user.outlet_id}`);
        }

        socket.on("stock_transfer_initiated", (data) => {
            setIncomingTransfer(data);
            setShow(true);
            
            // Also show a toast
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-boxdark shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <Store className="h-10 w-10 text-primary" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Stock Incoming!
                                </p>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {data.from_name} is transferring {data.items_count} items.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-gray-200 dark:border-strokedark">
                        <button
                            onClick={() => {
                                setShow(true);
                                toast.dismiss(t.id);
                            }}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            View
                        </button>
                    </div>
                </div>
            ), { duration: 10000 });
        });

        socket.on("stock_transfer_cancelled", (data) => {
             // If we had a specific ID we'd check it, but for now let's just close if something was cancelled
             setShow(false);
             setIncomingTransfer(null);
             toast.error("A pending transfer was cancelled.");
        });

        socket.on("stock_transfer_completed", (data) => {
            setShow(false);
            setIncomingTransfer(null);
            toast.success("Transfer completed and stock received!");
        });

        return () => {
            socket.off("stock_transfer_initiated");
            socket.off("stock_transfer_cancelled");
            socket.off("stock_transfer_completed");
        };
    }, [socket, user]);

    if (!show || !incomingTransfer) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-boxdark rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse"></div>
                
                <button 
                    onClick={() => setShow(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                    <Truck size={32} />
                </div>
                
                <h3 className="text-2xl font-bold text-center text-black dark:text-white mb-2">
                    {incomingTransfer.is_resend ? "OTP Resent!" : "Incoming Stock Transfer"}
                </h3>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6 px-4">
                    <strong>{incomingTransfer.from_name}</strong> is {incomingTransfer.is_resend ? "updated the OTP for " : "transferring "} <strong>{incomingTransfer.items_count}</strong> items to your outlet.
                </p>

                <div className="bg-gray-50 dark:bg-meta-4/30 rounded-xl p-6 mb-4 border border-stroke dark:border-strokedark text-center relative overflow-hidden">
                    {incomingTransfer.is_resend && (
                        <div className="absolute top-0 right-0 bg-primary text-[8px] text-white px-2 py-0.5 rounded-bl-lg font-bold uppercase tracking-tighter">
                            New OTP
                        </div>
                    )}
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2 block">Your OTP for this Transfer</span>
                    <div className="flex items-center justify-center gap-2">
                        <KeyRound size={20} className="text-primary" />
                        <span className="text-4xl font-black text-primary tracking-[0.2em]">{incomingTransfer.otp}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-tighter">
                        Share this OTP with the sender to confirm receipt.
                    </p>
                </div>

                {/* Items List */}
                {incomingTransfer.items && incomingTransfer.items.length > 0 && (
                    <div className="mb-6 max-h-[150px] overflow-y-auto border border-stroke dark:border-strokedark rounded-xl p-2 bg-gray-50/50 dark:bg-meta-4/10">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 px-2 sticky top-0 bg-inherit py-1">Items to be Received</p>
                        <div className="space-y-1">
                            {incomingTransfer.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-boxdark border border-stroke/50 dark:border-strokedark/50 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-black dark:text-white line-clamp-1">{item.name}</span>
                                        {item.imei && <span className="text-[10px] text-primary font-medium tracking-tight">IMEI: {item.imei}</span>}
                                    </div>
                                    <CheckCircle2 size={12} className="text-green-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setShow(false)}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-opacity-90 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                    <CheckCircle2 size={20} />
                    {incomingTransfer.is_resend ? "Got New OTP" : "I Understand"}
                </button>
            </div>
        </div>
    );
};
