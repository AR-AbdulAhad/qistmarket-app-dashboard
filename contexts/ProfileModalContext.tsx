"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import CustomerProfileModal from "@/components/common/CustomerProfileModal";

interface ProfileModalContextValue {
    openProfile: (data: any) => void;
    closeProfile: () => void;
}

const ProfileModalContext = createContext<ProfileModalContextValue | null>(null);

export function ProfileModalProvider({ children }: { children: ReactNode }) {
    const [selectedProfile, setSelectedProfile] = useState<any>(null);

    const openProfile = useCallback((data: any) => setSelectedProfile(data), []);
    const closeProfile = useCallback(() => setSelectedProfile(null), []);

    return (
        <ProfileModalContext.Provider value={{ openProfile, closeProfile }}>
            {children}
            <CustomerProfileModal
                open={!!selectedProfile}
                onClose={closeProfile}
                data={selectedProfile}
            />
        </ProfileModalContext.Provider>
    );
}

export function useProfileModal() {
    const ctx = useContext(ProfileModalContext);
    if (!ctx) {
        throw new Error("useProfileModal must be used within a ProfileModalProvider");
    }
    return ctx;
}
