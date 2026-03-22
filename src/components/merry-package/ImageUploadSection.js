import { useRef, useState } from "react";
import Image from "next/image";

function ImageUploadSection({ iconUrl, setIconUrl, supabase }) {
  const [imageFile, setImageFile] = useState(null);
  const inputRef = useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const fileExt = file.name.split(".").pop();
    const fileName = `package-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("packages")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return;
    }

    const { data } = supabase.storage
      .from("packages")
      .getPublicUrl(fileName);

    setIconUrl(data.publicUrl); // ← อัปเดต form.icon_url
  };

  const handleRemove = () => {
    setImageFile(null);
    setIconUrl("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-25 h-33 flex flex-col gap-2">
      <label className="block mt-2 -mb-1 text-body2 font-medium text-black">
        Icon <span className="text-red-500">*</span>
      </label>

      <div className="relative w-25 h-25 rounded-lg flex items-center justify-center cursor-pointer">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <div onClick={() => inputRef.current?.click()}>
          {iconUrl ? (
            <div className="w-25 h-25 bg-gray-100 flex justify-center items-center border-none rounded-3xl">
            <Image
              src={iconUrl}
              alt="preview"
              width={32}
              height={32}
              className="object-cover rounded-lg"
            />
            </div>
          ) : (
            <Image
              src="/images/merry_package/upload-image.svg"
              width={100}
              height={100}
              alt="upload"
            />
          )}
        </div>

        {iconUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-utility-red rounded-full w-6 h-6 text-center text-md shadow text-white cursor-pointer"
          >
            x
          </button>
        )}
      </div>
    </div>
  );
}

export default ImageUploadSection;