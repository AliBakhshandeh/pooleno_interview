"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "error";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full";

    const variantClasses = {
      default: "bg-gray-600 text-gray-200",
      success: "bg-green-600 text-white",
      error: "bg-red-600 text-white",
    };

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";

export default Badge;
