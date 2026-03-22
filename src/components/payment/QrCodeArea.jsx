import { cn } from "@/lib/utils";

/**
 * พื้นที่สำหรับแสดง QR code ชำระเงิน (เช่น PromptPay)
 * รับ children เป็นรูป QR หรือ component ที่แสดง QR
 * โครงและสไตล์ให้สอดคล้องกับ CreditCardForm
 *
 * @param {{
 *   title?: string;
 *   children?: React.ReactNode;
 *   className?: string;
 * }} props
 */
export function QrCodeArea({
  title = "Pay with QR",
  children,
  className,
}) {
  return (
    <div className={cn(className)} aria-label={title}>
      <header className="flex items-center justify-between p-6 bg-gray-100">
        <div className="text-body1 text-gray-700">{title}</div>
      </header>
      <div className="flex flex-col gap-4 py-6 px-4">
        <div className="flex flex-col items-center justify-center min-h-[200px] rounded-[8px] border border-gray-400 bg-white py-6 lg:min-h-[472px] [&_img]:min-w-[280px] [&_img]:min-h-[280px] [&_img]:max-w-[360px] [&_img]:max-h-[360px] [&_img]:w-full [&_img]:object-contain">
          {children ?? (
            <p className="text-body2 text-gray-600">
              QR code will be displayed here
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
