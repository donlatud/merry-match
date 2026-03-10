"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { apiClient } from "@/lib/apiClient";
import { parseFeaturesParam } from "@/lib/paymentHelpers";

const DEFAULT_FEATURES = [
  "\u201CMerry\u201D more than a daily limited",
  "Up to 70 Merry per day",
];

const PAYMENT_GATEWAY =
  typeof process.env.NEXT_PUBLIC_PAYMENT_GATEWAY === "string"
    ? process.env.NEXT_PUBLIC_PAYMENT_GATEWAY
    : "mock";
const OMISE_PUBLIC_KEY = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY || "";

function parseIntParam(value) {
  const n =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function buildSuccessUrl(data, fallback) {
  const params = new URLSearchParams({
    packageName: data.packageName ?? fallback.packageName,
    amount: data.amount ?? fallback.amount ?? "149.00",
    currency: data.currency ?? fallback.currency ?? "THB",
    startDate: data.startDate ?? new Date().toISOString(),
    nextBillingDate:
      data.nextBillingDate ??
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const features = data.features ?? fallback.features;
  if (Array.isArray(features) && features.length > 0) {
    params.set("features", JSON.stringify(features));
  }
  return `/payment/success?${params.toString()}`;
}

function buildFailedUrl(subId, message) {
  const encoded = encodeURIComponent(message || "Payment failed");
  return subId
    ? `/payment/failed?subscriptionId=${subId}&message=${encoded}`
    : `/payment/failed?message=${encoded}`;
}

function createOmiseToken(values) {
  const Omise = typeof window !== "undefined" ? window.Omise : null;
  if (!Omise) return Promise.reject(new Error("Omise not loaded"));

  Omise.setPublicKey(OMISE_PUBLIC_KEY);

  const expiry = (values.expiry || "").trim().split("/");
  const month = expiry[0] ? parseInt(expiry[0], 10) : 0;
  const yearRaw = expiry[1] ? parseInt(expiry[1], 10) : 0;
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;

  return new Promise((resolve, reject) => {
    Omise.createToken(
      "card",
      {
        number: (values.cardNumber || "").replace(/\s/g, ""),
        name: values.cardOwner || "",
        expiration_month: month,
        expiration_year: year,
        security_code: (values.cvc || "").trim(),
      },
      (statusCode, response) => {
        if (statusCode === 200 && response?.id) {
          resolve(response.id);
        } else {
          reject(
            new Error(response?.message || "Invalid card or token creation failed")
          );
        }
      }
    );
  });
}

/**
 * Encapsulates all state and logic for the payment checkout page.
 *
 * @returns {{
 *   paymentMethod: string;
 *   setPaymentMethod: (m: string) => void;
 *   isSubmitting: boolean;
 *   features: string[];
 *   priceLabel: string;
 *   summaryMode: "purchase" | "change-plan";
 *   summaryCurrentPackageName: string | undefined;
 *   packageName: string;
 *   qr: { imageUrl: string; loading: boolean; error: string | null; redirecting: boolean };
 *   useOmiseScript: boolean;
 *   handlePaymentConfirm: (values: Record<string, string>) => Promise<void>;
 *   handleCancel: () => void;
 * }}
 */
export function usePaymentCheckout() {
  const router = useRouter();
  const {
    subscriptionId,
    mode,
    targetPackageId,
    currentPackageName,
    packageName = "Premium",
    amount,
    currency = "THB",
    features: featuresParam,
    simulateFail,
  } = router.query;

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [qrRedirecting, setQrRedirecting] = useState(false);

  const subId = useMemo(() => parseIntParam(subscriptionId), [subscriptionId]);
  const parsedTargetPkgId = useMemo(() => parseIntParam(targetPackageId), [targetPackageId]);
  const isChangePlan = mode === "change-plan" && parsedTargetPkgId != null;

  const features = useMemo(
    () => parseFeaturesParam(featuresParam, DEFAULT_FEATURES),
    [featuresParam]
  );

  const priceLabel =
    amount != null && amount !== ""
      ? `${currency} ${Number(amount).toFixed(2)}`
      : "THB 149.00";

  const summaryMode = isChangePlan ? "change-plan" : "purchase";
  const summaryCurrentPackageName =
    isChangePlan && typeof currentPackageName === "string"
      ? currentPackageName
      : undefined;

  const useOmiseScript = PAYMENT_GATEWAY === "omise" && !!OMISE_PUBLIC_KEY;

  const fallback = useMemo(
    () => ({ packageName, amount, currency, features }),
    [packageName, amount, currency, features]
  );

  // --- QR charge creation ---
  useEffect(() => {
    if (paymentMethod !== "qr") {
      setQrImageUrl("");
      setQrError(null);
      setQrLoading(false);
      return;
    }
    if (!subId) {
      setQrError("No subscription");
      setQrImageUrl("");
      return;
    }

    setQrLoading(true);
    setQrError(null);

    const body = { subscriptionId: subId };
    if (isChangePlan) body.targetPackageId = parsedTargetPkgId;

    apiClient
      .post("/merry-packages/pay-qr", body)
      .then(({ data }) => setQrImageUrl(data.qrImageUrl || ""))
      .catch((err) => {
        setQrError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Unable to create QR code"
        );
        setQrImageUrl("");
      })
      .finally(() => setQrLoading(false));
  }, [paymentMethod, subId, isChangePlan, parsedTargetPkgId]);

  // --- QR polling ---
  const qrPollRef = useRef(null);

  useEffect(() => {
    if (paymentMethod !== "qr" || !qrImageUrl) {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
      return;
    }

    const poll = () => {
      apiClient
        .get("/membership/me")
        .then(({ data }) => {
          const ok = isChangePlan
            ? data?.packageName && data.packageName === packageName
            : data?.status === "ACTIVE";

          if (!ok) return;

          clearInterval(qrPollRef.current);
          qrPollRef.current = null;
          setQrRedirecting(true);

          const successUrl = buildSuccessUrl(
            {
              packageName: data.packageName,
              startDate: new Date().toISOString(),
              nextBillingDate: data.expireAt,
              features,
            },
            fallback
          );
          setTimeout(() => router.replace(successUrl), 1000);
        })
        .catch(() => {});
    };

    poll();
    qrPollRef.current = setInterval(poll, 3000);
    return () => {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
    };
  }, [paymentMethod, qrImageUrl, isChangePlan, packageName, fallback, features, router]);

  useEffect(() => {
    if (paymentMethod !== "qr") setQrRedirecting(false);
  }, [paymentMethod]);

  // --- Card payment ---
  const handlePaymentConfirm = useCallback(
    async (values) => {
      if (!subId) {
        router.push(buildFailedUrl(null, "No subscription"));
        return;
      }

      setIsSubmitting(true);
      try {
        let data;
        const changePlanBody = isChangePlan
          ? { targetPackageId: parsedTargetPkgId }
          : {};

        if (useOmiseScript) {
          const cardToken = await createOmiseToken(values);
          const { data: chargeData } = await apiClient.post(
            "/merry-packages/pay-card",
            { subscriptionId: subId, cardToken, ...changePlanBody }
          );
          data = chargeData;
        } else {
          const { data: mockData } = await apiClient.post(
            "/merry-packages/pay-card",
            { subscriptionId: subId, success: !simulateFail, ...changePlanBody }
          );
          data = mockData;
        }

        if (data.success) {
          router.push(buildSuccessUrl(data, fallback));
        } else {
          router.push(buildFailedUrl(subId, data.message));
        }
      } catch (err) {
        const message =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Payment failed";
        router.push(buildFailedUrl(subId, message));
      } finally {
        setIsSubmitting(false);
      }
    },
    [subId, isChangePlan, parsedTargetPkgId, useOmiseScript, simulateFail, fallback, router]
  );

  const handleCancel = useCallback(() => {
    router.push("/payment");
  }, [router]);

  return {
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    features,
    priceLabel,
    summaryMode,
    summaryCurrentPackageName,
    packageName,
    qr: {
      imageUrl: qrImageUrl,
      loading: qrLoading,
      error: qrError,
      redirecting: qrRedirecting,
    },
    useOmiseScript,
    handlePaymentConfirm,
    handleCancel,
  };
}
