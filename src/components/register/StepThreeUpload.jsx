import { useRef } from "react";
import { PhotoUploadCard } from "@/components/register/PhotoUploadCard";

const TOTAL_SLOTS = 5;

const defaultStep3Form = () => ({
  photos: Array.from({ length: TOTAL_SLOTS }, () => null),
});

export const getDefaultStep3Form = defaultStep3Form;

export const StepThreeUpload = ({
  formData = defaultStep3Form(),
  setFormData,
  errors = {},
}) => {
  const fileInputRef = useRef(null);
  const pendingSlotRef = useRef(null);

  const photos = formData.photos ?? Array.from({ length: TOTAL_SLOTS }, () => null);

  const handleUploadClick = (slotIndex) => {
    pendingSlotRef.current = slotIndex;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file == null) return;
    const index = pendingSlotRef.current;
    if (index == null || index < 0 || index >= TOTAL_SLOTS) return;
    setFormData((prev) => {
      const next = [...(prev.photos ?? [])];
      while (next.length < TOTAL_SLOTS) next.push(null);
      next[index] = file;
      return { ...prev, photos: next };
    });
    e.target.value = "";
    pendingSlotRef.current = null;
  };

  const handleRemove = (slotIndex) => {
    setFormData((prev) => {
      const next = [...(prev.photos ?? [])];
      while (next.length < TOTAL_SLOTS) next.push(null);
      next[slotIndex] = null;
      return { ...prev, photos: next };
    });
  };

  return (
    <section
      className="flex flex-col gap-[24px] bg-utility-bg-main px-4 py-10 lg:px-6 lg:pt-0 lg:pb-6"
      aria-labelledby="profile-pictures-heading"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={handleFileChange}
      />
      <header className="flex flex-col gap-1">
        <div
          id="profile-pictures-heading"
          className="text-headline4 text-purple-500"
        >
          Profile pictures
        </div>
        <div className="text-body2 text-gray-800">
          Upload at least 2 photos
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <div
          className="grid grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-[24px]"
          role="list"
          aria-label="Profile photo slots"
        >
          {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
            const slotNumber = i + 1;
            const hasImage = !!photos[i];
            return (
              <PhotoUploadCard
                key={slotNumber}
                slotNumber={slotNumber}
                hasImage={hasImage}
                file={photos[i] ?? null}
                onRemove={() => handleRemove(i)}
                onUpload={() => handleUploadClick(i)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
