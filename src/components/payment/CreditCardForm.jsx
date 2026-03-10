"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import { cn } from "@/lib/utils";

function normalizeCardNumber(raw) {
  return (raw || "").replace(/[^\d]/g, "");
}

function validateCardForm(values) {
  const errors = {};

  const cardNumber = normalizeCardNumber(values.cardNumber);
  if (!cardNumber) {
    errors.cardNumber = "Card number is required";
  } else if (cardNumber.length < 12 || cardNumber.length > 19) {
    errors.cardNumber = "Card number looks invalid";
  }

  if (!values.cardOwner) {
    errors.cardOwner = "Card owner is required";
  }

  const expiry = values.expiry;
  const expiryMatch = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!expiry) {
    errors.expiry = "Expiry date is required";
  } else if (!expiryMatch) {
    errors.expiry = "Expiry date must be in MM/YY format";
  } else {
    const month = Number(expiryMatch[1]);
    if (month < 1 || month > 12) {
      errors.expiry = "Expiry month must be between 01 and 12";
    }
  }

  const cvc = (values.cvc || "").replace(/[^\d]/g, "");
  if (!cvc) {
    errors.cvc = "CVC/CVV is required";
  } else if (cvc.length < 3 || cvc.length > 4) {
    errors.cvc = "CVC/CVV looks invalid";
  }

  return errors;
}

/**
 * ฟอร์มกรอกข้อมูลบัตรเครดิตสำหรับหน้า Payment (payment1)
 *
 * @param {{
 *   onSubmit?: (values: { cardNumber: string; cardOwner: string; expiry: string; cvc: string }) => void;
 *   onCancel?: () => void;
 *   isSubmitting?: boolean;
 *   className?: string;
 * }} props
 */
export function CreditCardForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  className,
}) {
  const [form, setForm] = useState({
    cardNumber: "",
    cardOwner: "",
    expiry: "",
    cvc: "",
  });
  const [errors, setErrors] = useState({});

  const updateField = (field) => (e) => {
    let value = e.target.value;

    if (field === "expiry") {
      // Keep only digits
      const digits = value.replace(/[^\d]/g, "").slice(0, 4);
      if (digits.length <= 2) {
        value = digits;
      } else {
        value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      }
    }

    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = {
      cardNumber: form.cardNumber.trim(),
      cardOwner: form.cardOwner.trim(),
      expiry: form.expiry.trim(),
      cvc: form.cvc.trim(),
    };
    const nextErrors = validateCardForm(trimmed);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some((msg) => msg)) return;

    onSubmit?.(trimmed);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-gray-100">
        <div className="text-body1 text-gray-700">
          Credit Card
        </div>
        <div className="flex items-center gap-3">
          <img
            src="/merry_icon/icon-visa.svg"
            alt="VISA"
            className="h-7 w-10"
          />
          <img
            src="/merry_icon/icon-mastercard.svg"
            alt="Mastercard"
            className="h-7 w-12"
          />
        </div>
      </div>
      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Form Content */}
        <div className="flex flex-col gap-10 py-6 px-4">
          {/* Card Number */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="payment-card-number"
              className="text-body2 text-neutral-900"
            >
              Card number <span className="text-body2 text-utility-red">*</span>
            </label>
            <Input
              id="payment-card-number"
              type="text"
              placeholder="Number of card"
              value={form.cardNumber}
              onChange={updateField("cardNumber")}
              className={cn(
                "h-12 rounded-[8px] border-gray-400 py-3 px-4 placeholder:text-body2 placeholder:text-gray-600",
                errors.cardNumber && "border-red-500"
              )}
              autoComplete="cc-number"
            />
            {errors.cardNumber && (
              <p className="text-body5 text-red-500" role="alert">
                {errors.cardNumber}
              </p>
            )}
          </div>
          {/* Card Owner */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="payment-card-owner"
              className="text-body2 text-neutral-900"
            >
              Card owner <span className="text-body2 text-utility-red">*</span>
            </label>
            <Input
              id="payment-card-owner"
              type="text"
              placeholder="Holder of card"
              value={form.cardOwner}
              onChange={updateField("cardOwner")}
              className={cn(
                "h-12 rounded-[8px] border-gray-400 py-3 px-4 placeholder:text-body2 placeholder:text-gray-600",
                errors.cardOwner && "border-red-500"
              )}
              autoComplete="cc-name"
            />
            {errors.cardOwner && (
              <p className="text-body5 text-red-500" role="alert">
                {errors.cardOwner}
              </p>
            )}
          </div>
          {/* Expiry Date and CVC/CVV */}
          <div className="grid grid-cols-2 gap-5.5">
            {/* Expiry Date */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="payment-expiry"
                className="text-body2 text-neutral-900"
              >
                Expiry date <span className="text-body2 text-utility-red">*</span>
              </label>
              <Input
                id="payment-expiry"
                type="text"
                placeholder="MM/YY"
                value={form.expiry}
                onChange={updateField("expiry")}
                className={cn(
                  "h-12 rounded-[8px] border-gray-400 py-3 px-4 placeholder:text-body2 placeholder:text-gray-600",
                  errors.expiry && "border-red-500"
                )}
                autoComplete="cc-exp"
              />
              {errors.expiry && (
                <p className="text-body5 text-red-500" role="alert">
                  {errors.expiry}
                </p>
              )}
            </div>
            {/* CVC/CVV */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="payment-cvc"
                className="text-body2 text-neutral-900"
              >
                CVC/CVV <span className="text-body2 text-utility-red">*</span>
              </label>
              <Input
                id="payment-cvc"
                type="text"
                placeholder="x x x"
                value={form.cvc}
                onChange={updateField("cvc")}
                className={cn(
                  "h-12 rounded-[8px] border-gray-400 py-3 px-4 placeholder:text-body2 placeholder:text-gray-600",
                  errors.cvc && "border-red-500"
                )}
                autoComplete="cc-csc"
              />
              {errors.cvc && (
                <p className="text-body5 text-red-500" role="alert">
                  {errors.cvc}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Form Footer */}
        <div className="flex items-center justify-between pt-6 px-6 pb-8 border-t border-gray-400 lg:h-[104px]">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 min-w-[66px] rounded-[16px] py-1 px-2 text-[16px] font-bold leading-[24px] text-red-500 hover:underline cursor-pointer inline-flex items-center justify-center"
          >
            Cancel
          </button>
          <PrimaryButton type="submit" disabled={isSubmitting} className="min-w-[177px] h-[48px] rounded-[99px] py-3 px-6 text-body2 font-bold text-utility-white">
            {isSubmitting ? "Processing…" : "Payment Confirm"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
