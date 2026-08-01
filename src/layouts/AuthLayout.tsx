import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className = "" }: AuthLayoutProps) {
  return (
    <div className={`min-h-screen w-full relative flex items-center justify-center bg-[#0d1f3c] text-white overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
