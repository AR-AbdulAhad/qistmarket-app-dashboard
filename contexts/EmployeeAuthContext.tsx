"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export interface EmployeeUser {
  id: number;
  employee_id: string;
  full_name: string;
  username: string;
  department?: string | null;
  designation?: string | null;
  outlet_id?: number | null;
  outlet_name?: string | null;
  role: string;
  type: string;
}

interface EmployeeAuthContextType {
  user: EmployeeUser | null;
  loading: boolean;
  setUser: (user: EmployeeUser | null) => void;
  logout: () => void;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | undefined>(undefined);

export const EmployeeAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<EmployeeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("employee_auth_token");
    if (token) {
      try {
        const decoded = jwtDecode<EmployeeUser>(token);
        if (decoded.type === "employee") setUser(decoded);
        else Cookies.remove("employee_auth_token");
      } catch {
        Cookies.remove("employee_auth_token");
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    Cookies.remove("employee_auth_token");
    setUser(null);
  };

  return (
    <EmployeeAuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};

export const useEmployeeAuth = () => {
  const ctx = useContext(EmployeeAuthContext);
  if (!ctx) throw new Error("useEmployeeAuth must be used within EmployeeAuthProvider");
  return ctx;
};
