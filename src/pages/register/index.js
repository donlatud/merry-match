"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { merryToast } from "@/components/commons/toast/MerryToast";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import NavBar from "@/components/NavBar";
import { StepIndicator } from "@/components/register/StepIndicator";
import { StepOneBasicInfo, getDefaultStep1Form } from "@/components/register/StepOneBasicInfo";
import { StepTwoInterests, getDefaultStep2Form } from "@/components/register/StepTwoInterests";
import { StepThreeUpload, getDefaultStep3Form } from "@/components/register/StepThreeUpload";
import { NavigationFooter } from "@/components/register/NavigationFooter";
import { validateStep1, validateStep2, validateStep3 } from "@/lib/registerValidation";
import { buildRegisterPayload } from "@/lib/registerPayload";
import { useRegisterSubmit } from "@/hooks/register/useRegisterSubmit";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Form, setStep1Form] = useState(() => getDefaultStep1Form());
  const [step1Errors, setStep1Errors] = useState({});
  const [step2Form, setStep2Form] = useState(() => getDefaultStep2Form());
  const [step2Errors, setStep2Errors] = useState({});
  const [step3Form, setStep3Form] = useState(() => getDefaultStep3Form());
  const [step3Errors, setStep3Errors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const router = useRouter();
  const { submit: submitRegister, isSubmitting } = useRegisterSubmit();

  useEffect(() => {
    if (Object.keys(step1Errors).length === 0) return;
    const result = validateStep1(step1Form);
    setStep1Errors(result.errors);
  }, [step1Form]);

  useEffect(() => {
    if (Object.keys(step2Errors).length === 0) return;
    const result = validateStep2(step2Form);
    setStep2Errors(result.errors);
  }, [step2Form]);

  useEffect(() => {
    if (Object.keys(step3Errors).length === 0) return;
    const result = validateStep3(step3Form);
    setStep3Errors(result.errors);
  }, [step3Form]);

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(3, prev + 1));
  };

  const handleConfirm = async () => {
    const step1 = validateStep1(step1Form);
    if (!step1.valid) {
      setStep1Errors(step1.errors);
      setStep2Errors({});
      setStep3Errors({});
      setCurrentStep(1);
      return;
    }
    setStep1Errors({});

    const step2 = validateStep2(step2Form);
    if (!step2.valid) {
      setStep2Errors(step2.errors);
      setStep3Errors({});
      setCurrentStep(2);
      return;
    }
    setStep2Errors({});

    const step3 = validateStep3(step3Form);
    if (!step3.valid) {
      setStep3Errors(step3.errors);
      setCurrentStep(3);
      if (step3.errors.photos) {
        merryToast.error(
          "Validation error",
          step3.errors.photos,
          <ExclamationCircleIcon className="size-10! text-red-400" />
        );
      }
      return;
    }
    setStep3Errors({});
    setSubmitError(null);
    const { payloadForApi, photoFiles } = buildRegisterPayload(step1Form, step2Form, step3Form);
    try {
      const data = await submitRegister(payloadForApi, photoFiles);
      setSubmitSuccess(data);
      setSubmitError(null);
      merryToast.success(
        "Registration successful",
        "You can now sign in with your account.",
        <CheckCircleIcon className="size-10! text-green-500" />
      );
      router.push("/login");
    } catch (err) {
      const message = err.response?.data?.error ?? err.message ?? "Registration failed";
      setSubmitError(message);
      setSubmitSuccess(null);
      merryToast.error(
        "Registration failed",
        message,
        <ExclamationCircleIcon className="size-10! text-red-400" />
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:min-h-screen">
      <NavBar />
      <Image
        src="/images/login/login-vector.svg"
        alt="Decorative background bubbles"
        width={108}
        height={133}
        className="hidden lg:block lg:absolute lg:top-38 lg:left-0 z-0"
      />
      <span
        className="hidden lg:block lg:absolute lg:right-4 lg:bottom-20 lg:-translate-y-1/2 lg:w-16 lg:h-16 lg:rounded-full lg:bg-beige-200 lg:translate-x-1/2 z-0"
        aria-hidden
      />
      <div className="bg-utility-bg-main lg:flex lg:flex-1 lg:flex-col lg:min-h-0 lg:gap-[80px]">
        <StepIndicator
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />
        <main className="lg:pt-0 lg:pb-[80px] lg:bg-utility-bg-main lg:px-[255px] lg:flex-1 lg:min-h-0">
        {currentStep === 1 && (
          <StepOneBasicInfo
            formData={step1Form}
            setFormData={setStep1Form}
            errors={step1Errors}
          />
        )}
        {currentStep === 2 && (
          <StepTwoInterests
            formData={step2Form}
            setFormData={setStep2Form}
            errors={step2Errors}
          />
        )}
        {currentStep === 3 && (
          <StepThreeUpload
            formData={step3Form}
            setFormData={setStep3Form}
            errors={step3Errors}
          />
        )}
        </main>
      </div>
      <NavigationFooter
        currentStep={currentStep}
        totalSteps={3}
        isSubmitting={isSubmitting}
        onBack={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
        onNext={handleNext}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
