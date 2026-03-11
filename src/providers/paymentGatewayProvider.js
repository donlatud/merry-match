/**
 * PaymentGatewayProvider – abstract interface สำหรับ payment gateway (Omise, Stripe ฯลฯ)
 *
 * เป้าหมาย:
 * - แยก logic ของ gateway (Omise, Stripe) ออกจาก domain ของเรา
 * - ทำให้สลับจาก mock → Omise → Stripe ได้ โดยไม่ต้องแก้โค้ดฝั่ง service/api เยอะ
 *
 * NOTE:
 * - Omise provider ถูกแยกไว้ที่ `src/providers/payment/omiseProvider.js`
 * - ตอนนี้ define แค่ shape / interface + factory function ที่จะถูกใช้ในภายหลัง
 */

import { createOmisePaymentGatewayProvider } from "@/providers/payment/omiseProvider";

/**
 * @typedef {Object} CreateChargeParams
 * @property {string} amount - จำนวนเงินเป็นสตริง (เช่น "149.00")
 * @property {string} currency - เช่น "THB"
 * @property {string} description - ข้อความอธิบาย charge (เช่น "MerryMatch Premium 1 month")
 * @property {string} [cardToken] - token จาก frontend (เช่น Omise card token)
 * @property {string} [customerId] - id ลูกค้าใน gateway (ถ้ามี)
 * @property {Record<string, any>} [metadata] - metadata เพิ่มเติม เช่น { subscriptionId, packageName }
 */

/**
 * @typedef {Object} CreateChargeResult
 * @property {string} id - id ของ charge ใน gateway
 * @property {string} status - สถานะ charge เช่น "pending", "successful", "failed"
 * @property {string} amount - จำนวนเงิน
 * @property {string} currency - สกุลเงิน
 * @property {any} raw - raw response จาก gateway (สำหรับ log/debug)
 */

/**
 * @typedef {Object} CreateQrChargeParams
 * @property {string} amount
 * @property {string} currency
 * @property {string} description
 * @property {Record<string, any>} [metadata]
 */

/**
 * @typedef {Object} CreateQrChargeResult
 * @property {string} id - id ของ source/charge สำหรับ QR
 * @property {string} status - สถานะเริ่มต้นของ QR charge
 * @property {string} qrImageUrl - URL ของ QR image (หรือ data URI) สำหรับแสดงบนหน้า Payment1
 * @property {any} raw - raw response จาก gateway
 */

/**
 * @typedef {Object} WebhookEvent
 * @property {string} id - id ของ event ใน gateway
 * @property {string} type - ประเภท event เช่น "charge.succeeded", "charge.failed"
 * @property {any} data - payload ที่ mapping แล้ว (เช่น amount, currency, chargeId, subscriptionId)
 * @property {any} raw - raw body ทั้งก้อนจาก gateway
 */

/**
 * @typedef {Object} PaymentGatewayProvider
 * @property {(params: CreateChargeParams) => Promise<CreateChargeResult>} createCardCharge
 *   สร้าง charge จากบัตร (ใช้ cardToken / customerId แล้วแต่ gateway)
 * @property {(params: CreateQrChargeParams) => Promise<CreateQrChargeResult>} [createQrCharge]
 *   (Optional) สร้าง charge สำหรับ QR code (เช่น Omise PromptPay)
 * @property {(rawBody: string | Buffer, signature: string | undefined, headers: Record<string, string | string[] | undefined>) => Promise<WebhookEvent>} handleWebhook
 *   แปลง webhook raw body + signature จาก gateway ให้เป็น WebhookEvent แบบกลาง
 * @property {(subscriptionId: string) => Promise<void>} [cancelSubscription]
 *   (Optional) ยกเลิก subscription ที่ gateway (ใช้สำหรับ cancel package เมื่อมี omise_subscription_id)
 */

/**
 * ชื่อ gateway ปัจจุบัน (mock, omise, stripe ฯลฯ)
 * - ตั้งค่าใน .env เช่น PAYMENT_GATEWAY=mock หรือ PAYMENT_GATEWAY=omise
 * - Phase 1: ยืนยันใช้ Omise เป็น default สำหรับ first purchase + change-plan + (อนาคต) subscription
 */
export const CURRENT_PAYMENT_GATEWAY = "omise";

/**
 * Factory สำหรับคืน PaymentGatewayProvider ตามชื่อ gateway
 *
 * NOTE:
 * - Phase 2.5: define interface + factory function
 * - Phase 2.6: มี mock provider (CURRENT_PAYMENT_GATEWAY=mock)
 * - Phase 2.7: จะเพิ่ม Omise provider จริงเข้ามา (และ Stripe ตามมาได้)
 *
 * @returns {PaymentGatewayProvider}
 */
export function getPaymentGatewayProvider() {
  return createOmisePaymentGatewayProvider();
}

