import { useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import { supabase } from "@/providers/supabase.provider";
import Modal from "../commons/modal/modal";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import { SecondaryButton } from "@/components/commons/button/SecondaryButton";
import InputBar from "@/components/commons/input/InputBar";
import NumberBar from "@/components/commons/input/NumberBar";
import ImageUploadSection from "@/components/merry-package/ImageUploadSection";
import PackageDetailsSection from "@/components/merry-package/PackageDetailsSection";

export default function PackageForm({
  title = "Package Form",
  submitLabel = "Save",
  initialData,
  onSubmit,
  onCancel,
  deletePackage,
}) {
  const [imageFile, setImageFile] = useState(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: 0,
    limit_matching: 0,
    icon_url: "",
    details: [{ id: nanoid(), value: "" }],
  });

  // รองรับ edit mode
  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        details:
          initialData.details?.length > 0
            ? initialData.details
            : [{ id: nanoid(), value: "" }],
      });
    }
  }, [initialData]);

  const hasError =
    !form.name || !form.price || form.details.some((d) => !d.value.trim());

  const handleInputChange = (field) => (eOrValue) => {
    const value =
      typeof eOrValue === "object" ? eOrValue.target.value : eOrValue;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasError) return;

    onSubmit({
      ...form,
      price: Number(form.price),
      limit_matching: Number(form.limit_matching),
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-15 py-4 shrink-0">
        <h4 className="text-headline4 font-bold">{title}</h4>
        <div className="flex gap-4">
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSubmit}>{submitLabel}</PrimaryButton>
        </div>
      </div>

      <hr className="shrink-0" />

      {/* Gray area */}
      <div className="flex-1 bg-gray-100 px-15 py-6">
        <div className="relative w-full gap-2">
          <form className="bg-white px-25 pt-10 pb-15 w-full flex flex-col gap-10 rounded-3xl">
            <div className="flex gap-10">
              <div className="flex flex-col gap-10 w-full">
                <InputBar
                  value={form.name}
                  onChange={handleInputChange("name")}
                  label="Package Name *"
                  className="w-full"
                />

                <InputBar
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={handleInputChange("price")}
                  label="Package Price *"
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-10 w-full">
                <NumberBar
                  value={form.limit_matching}
                  onChange={handleInputChange("limit_matching")}
                  min={0}
                  label="Merry Limit *"
                  className="w-full"
                />

                <ImageUploadSection
                  imageFile={imageFile}
                  setImageFile={setImageFile}
                  iconUrl={form.icon_url}
                  setIconUrl={(url) =>
                    setForm((prev) => ({
                      ...prev,
                      icon_url: url,
                    }))
                  }
                  inputRef={inputRef}
                  supabase={supabase}
                />
              </div>
            </div>
            <hr />

            <PackageDetailsSection
              details={form.details}
              setDetails={(updater) =>
                setForm((prev) => ({
                  ...prev,
                  details:
                    typeof updater === "function"
                      ? updater(prev.details)
                      : updater,
                }))
              }
            />
          </form>
          {deletePackage && (
            <button
              onClick={() => setOpen(true)}
              className="absolute right-0 top-full mt-2 text-[16px] text-gray-700 cursor-pointer"
            >
              Delete Package
            </button>
          )}
        </div>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete Confirmation"
        message="Do you sure to delete this Package?"
        leftText="Yes, I want to delete"
        rightText="No, I don't want"
        onLeftClick={async () => {
          if (deletePackage) {
            await deletePackage(); // เรียกฟังก์ชันจาก parent
          }
          setOpen(false);
        }}
        onRightClick={() => {
          setOpen(false);
        }}
        type="primary"
      />
    </div>
  );
}
