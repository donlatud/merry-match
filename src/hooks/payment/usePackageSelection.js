"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/login/useAuth";
import { mapPackageFromApi } from "@/lib/paymentHelpers";

function buildCheckoutUrl({
  subscriptionId,
  packageName,
  amount,
  currency,
  allFeatures,
  mode,
  targetPackageId,
  currentPackageName,
}) {
  const params = new URLSearchParams({ subscriptionId: String(subscriptionId) });
  if (packageName) params.set("packageName", packageName);
  if (amount != null) params.set("amount", String(amount));
  if (currency) params.set("currency", currency);
  if (Array.isArray(allFeatures) && allFeatures.length > 0) {
    params.set("features", JSON.stringify(allFeatures));
  }
  if (mode === "change-plan") {
    params.set("mode", "change-plan");
    if (targetPackageId != null) params.set("targetPackageId", String(targetPackageId));
    if (currentPackageName) params.set("currentPackageName", currentPackageName);
  }
  return `/payment/checkout?${params.toString()}`;
}

/**
 * Encapsulates packages + membership loading and checkout/change-plan handlers.
 */
export function usePackageSelection() {
  const router = useRouter();
  const { user } = useAuth();

  const [membership, setMembership] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [checkoutingPackageId, setCheckoutingPackageId] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const [pendingChangePackage, setPendingChangePackage] = useState(null);

  const isActive = membership?.status === "ACTIVE" && membership?.expireAt;
  const currentPackageName = useMemo(
    () => (typeof membership?.packageName === "string" ? membership.packageName : ""),
    [membership?.packageName]
  );

  useEffect(() => {
    const requests = [axios.get("/api/package")];
    if (user?.id) {
      requests.push(apiClient.get("/membership/me"));
    }

    Promise.allSettled(requests)
      .then((results) => {
        const packagesRes = results[0];
        if (packagesRes.status === "fulfilled") {
          const data = packagesRes.value.data;
          setPackages(Array.isArray(data) ? data.map(mapPackageFromApi) : []);
          setError(null);
        } else {
          const err = packagesRes.reason;
          setError(err?.response?.data?.message ?? err?.message ?? "Failed to load packages");
          setPackages([]);
        }

        const membershipRes = results[1];
        if (membershipRes?.status === "fulfilled") {
          setMembership(membershipRes.value.data ?? null);
        } else if (membershipRes?.status === "rejected") {
          setMembership(null);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const goCheckout = useCallback(
    (selectedPackage, payload) => {
      const limitText = selectedPackage?.limitText ?? "";
      const features = Array.isArray(selectedPackage?.features) ? selectedPackage.features : [];
      const allFeatures = [...(limitText ? [limitText] : []), ...features];

      const url = buildCheckoutUrl({
        subscriptionId: payload.subscriptionId,
        packageName: payload.packageName,
        amount: payload.amount,
        currency: payload.currency,
        allFeatures,
        mode: payload.mode,
        targetPackageId: payload.targetPackageId,
        currentPackageName,
      });
      router.push(url);
    },
    [router, currentPackageName]
  );

  const onChoosePackage = useCallback(
    (selectedPackage) => {
      const packageId = selectedPackage?.id;
      setCheckoutError(null);

      if (!user?.id) {
        router.push("/login");
        return;
      }

      if (isActive) {
        setPendingChangePackage(selectedPackage);
        setChangePlanModalOpen(true);
        return;
      }

      setCheckoutingPackageId(packageId);
      apiClient
        .post("/package/checkout", { packageId })
        .then((res) => {
          const data = res.data ?? {};
          const { subscriptionId, packageName, amount, currency } = data;
          if (subscriptionId != null) {
            goCheckout(selectedPackage, {
              subscriptionId,
              packageName,
              amount,
              currency,
            });
          } else {
            setCheckoutError("Invalid response from checkout");
          }
        })
        .catch((err) => {
          setCheckoutError(
            err.response?.data?.error ??
              err.response?.data?.message ??
              err.message ??
              "Checkout failed"
          );
        })
        .finally(() => setCheckoutingPackageId(null));
    },
    [user?.id, router, isActive, goCheckout]
  );

  const closeChangePlanModal = useCallback(() => {
    setChangePlanModalOpen(false);
    setPendingChangePackage(null);
  }, []);

  const onChangePlanConfirm = useCallback(() => {
    const selected = pendingChangePackage;
    if (!selected?.id) {
      closeChangePlanModal();
      return;
    }

    setCheckoutingPackageId(selected.id);
    apiClient
      .post("/package/change-plan", { targetPackageId: selected.id })
      .then((res) => {
        const data = res.data ?? {};
        const subscriptionId = data.subscriptionId;
        const target = data.targetPackage;
        if (subscriptionId != null && target?.id) {
          goCheckout(selected, {
            subscriptionId,
            packageName: target.name,
            amount: data.amount,
            currency: data.currency,
            mode: "change-plan",
            targetPackageId: target.id,
          });
        } else {
          setCheckoutError("Invalid response from change-plan");
        }
      })
      .catch((err) => {
        setCheckoutError(
          err.response?.data?.error ??
            err.response?.data?.message ??
            err.message ??
            "Change plan failed"
        );
      })
      .finally(() => {
        closeChangePlanModal();
        setCheckoutingPackageId(null);
      });
  }, [pendingChangePackage, closeChangePlanModal, goCheckout]);

  const changePlanMessage =
    currentPackageName && pendingChangePackage?.name
      ? `Do you want to change your plan from ${currentPackageName} to ${pendingChangePackage.name}? The new billing period will start immediately.`
      : "Do you want to change your plan? The new billing period will start immediately.";

  return {
    packages,
    membership,
    loading,
    error,
    checkoutError,
    checkoutingPackageId,
    onChoosePackage,
    changePlanModal: {
      open: changePlanModalOpen,
      message: changePlanMessage,
      onCancel: closeChangePlanModal,
      onConfirm: onChangePlanConfirm,
    },
  };
}

