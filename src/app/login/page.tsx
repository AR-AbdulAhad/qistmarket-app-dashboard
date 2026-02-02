import Signin from "@/components/Auth/Signin";
import Image from "next/image";
import logo from "@/assets/logos/logo.png";
import GuestRoute from "@/components/GuestRoute";
import { AuthProvider } from "../../../contexts/AuthContext";

export default function SignIn() {
  return (
    <>
    <AuthProvider>
    <GuestRoute>
      <div className="rounded-[10px] bg-white shadow-1 min-h-screen flex justify-center">
        <div className="flex flex-wrap items-center">
          <div className="w-full xl:w-1/2">
            <div className="w-full p-4 sm:p-12.5 xl:p-15">
              <Signin />
            </div>
          </div>

          <div className="hidden w-full p-4 xl:block xl:w-1/2">
            <div className="overflow-hidden p-8 min-h-screen flex justify-center items-center rounded-tr-[10px] rounded-br-[10px]">
                <Image
                  src={logo}
                  alt="Logo"
                  width={400}
                  height={32}
                />
            </div>
          </div>
        </div>
      </div>
      </GuestRoute>
      </AuthProvider>
    </>
  );
}
