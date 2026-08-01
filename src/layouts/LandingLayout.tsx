import React from "react";

interface LandingLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function LandingLayout({ children, className = "" }: LandingLayoutProps) {
  return (
    <div className={`min-h-screen w-full relative bg-[#0d1f3c] text-white overflow-x-hidden ${className}`}>
      {children}
    </div>
  );
}
