"use client";

import { cn } from "@/lib/utils";
import { CreditCard, QrCode } from "lucide-react";

const METHODS = [
  { id: "card", label: "Credit / Debit Card", Icon: CreditCard },
  { id: "qr", label: "Pay with QR (PromptPay)", Icon: QrCode },
];

/**
 * ตัวเลือกช่องทางชำระเงิน (บัตร / QR)
 * ธีมเดียวกับ MembershipSummaryCard: bg-gray-100, บล็อกขาว/ม่วงเมื่อเลือก
 *
 * @param {{
 *   value: string;
 *   onChange: (id: string) => void;
 *   className?: string;
 * }} props
 */
export function PaymentMethodSelector({ value, onChange, className }) {
  return (
    <section
      className={cn(
        "border-b border-gray-400 bg-gray-100 pt-8 px-6 pb-4 flex flex-col gap-4 lg:rounded-[24px] lg:border lg:border-gray-400",
        className
      )}
      aria-label="ช่องทางชำระเงิน"
    >
      <header className="flex items-center gap-3">
        <img
          src="/merry_icon/icon-merry-package.svg"
          alt=""
          aria-hidden
          className="h-6 w-6 shrink-0"
        />
        <h2 className="text-body1 text-gray-700 font-medium">
          Choose payment method
        </h2>
      </header>

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Payment method">
        {METHODS.map((method) => {
          const isSelected = value === method.id;
          return (
            <label
              key={method.id}
              className={cn(
                "flex items-center gap-3 cursor-pointer rounded-lg border py-3 px-4 text-body2 transition-colors",
                isSelected
                  ? "border-purple-500 bg-purple-50 text-purple-800"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              )}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={isSelected}
                onChange={() => onChange(method.id)}
                className="sr-only"
              />
              <method.Icon
                className="h-5 w-5 shrink-0 opacity-80"
                aria-hidden
              />
              <span className="flex-1 font-medium">{method.label}</span>
              {isSelected && (
                <img
                  src="/merry_icon/icon-correct-purple.svg"
                  alt=""
                  aria-hidden
                  className="h-5 w-5 shrink-0"
                />
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
}
