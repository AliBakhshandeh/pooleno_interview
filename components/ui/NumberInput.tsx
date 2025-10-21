"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  value?: number | string;
  onChange?: (value: string, numberValue: number) => void;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      label,
      error,
      value,
      onChange,
      decimalPlaces = 8,
      prefix,
      suffix,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState("");

    const displayValue =
      value !== undefined ? (value === "" ? "" : String(value)) : internalValue;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value;

        if (prefix && inputValue.startsWith(prefix)) {
          inputValue = inputValue.slice(prefix.length);
        }
        if (suffix && inputValue.endsWith(suffix)) {
          inputValue = inputValue.slice(0, -suffix.length);
        }

        if (inputValue === "") {
          if (value === undefined) {
            setInternalValue("");
          }
          onChange?.("", 0);
          return;
        }

        const numberRegex = /^(\d+\.?\d*|\.\d+)$/;
        if (!numberRegex.test(inputValue)) {
          return;
        }

        const decimalPart = inputValue.split(".")[1];
        if (decimalPart && decimalPart.length > decimalPlaces) {
          return;
        }

        const numberValue = parseFloat(inputValue) || 0;

        if (value === undefined) {
          setInternalValue(inputValue);
        }
        onChange?.(inputValue, numberValue);
      },
      [onChange, value, decimalPlaces, prefix, suffix]
    );

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="text-gray-400 mr-1 text-sm">{prefix}</span>
          )}
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            className={cn(
              "w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="text-gray-400 ml-1 text-sm">{suffix}</span>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

export default NumberInput;
