import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

export const PhotoUploadCard = ({
  slotNumber,
  hasImage = false,
  file = null,
  imageUrl = null,
  onRemove,
  onUpload,
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file || !(file instanceof File)) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayUrl = previewUrl ?? (typeof imageUrl === "string" && imageUrl ? imageUrl : null);

  if (hasImage && displayUrl) {
    return (
      <div
        role="listitem"
        className="relative z-10 aspect-square rounded-xl"
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl bg-gray-300">
          <img
            src={displayUrl}
            alt={`Profile photo ${slotNumber}`}
            className="h-full w-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-[-4px] top-[-4px] z-10 flex size-6 cursor-pointer items-center justify-center rounded-full bg-[#AF2758] text-white shadow transition hover:bg-[#AF2758]/90 focus:outline-none focus:ring-2 focus:ring-[#AF2758]/40 focus:ring-offset-2"
          aria-label={`Remove photo ${slotNumber}`}
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    );
  }

  if (hasImage && !displayUrl) {
    return (
      <div
        role="listitem"
        className="relative z-10 aspect-square rounded-xl"
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-xl bg-gray-300"
          aria-hidden
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-[-4px] top-[-4px] z-10 flex size-6 cursor-pointer items-center justify-center rounded-full bg-[#AF2758] text-white shadow transition hover:bg-[#AF2758]/90 focus:outline-none focus:ring-2 focus:ring-[#AF2758]/40 focus:ring-offset-2"
          aria-label={`Remove photo ${slotNumber}`}
        >
          <X size={15} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onUpload}
      className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-gray-300 bg-gray-100 text-purple-500 transition hover:border-purple-400 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
      aria-label={`Upload photo ${slotNumber}`}
    >
      <Plus size={24} aria-hidden />
      <span className="text-body4 ">Upload photo</span>
    </button>
  );
};
