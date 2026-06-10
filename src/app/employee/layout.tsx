"use client";

import { EmployeeAuthProvider } from "../../../contexts/EmployeeAuthContext";

export default function EmployeeRootLayout({ children }: { children: React.ReactNode }) {
  return <EmployeeAuthProvider>{children}</EmployeeAuthProvider>;
}
