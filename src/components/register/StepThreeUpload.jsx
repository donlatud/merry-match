import { useRef, useState } from "react";
import { PhotoUploadCard, SortablePhotoUploadCard } from "@/components/register/PhotoUploadCard";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";

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
  const [dropJustEnded, setDropJustEnded] = useState(false);

  const photos = formData.photos ?? Array.from({ length: TOTAL_SLOTS }, () => null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  const getPhotoDragBaseId = (photo, index) => {
    if (typeof photo === "string") return `url:${photo}`;
    if (photo instanceof File) {
      return `file:${photo.name}:${photo.size}:${photo.lastModified}`;
    }
    return `photo:${index}`;
  };

  const buildPhotoDragEntries = (photoList) => {
    const counter = new Map();
    return photoList
      .map((value, index) => ({ value, index }))
      .filter((item) => item.value != null)
      .map((item) => {
        const baseId = getPhotoDragBaseId(item.value, item.index);
        const count = counter.get(baseId) ?? 0;
        counter.set(baseId, count + 1);
        return {
          ...item,
          dragId: `${baseId}#${count}`,
        };
      });
  };

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
      const current = prev.photos ?? [];
      const kept = current.filter((value, i) => i !== slotIndex && value != null);
      const padded = [...kept, ...Array(TOTAL_SLOTS).fill(null)].slice(0, TOTAL_SLOTS);
      return { ...prev, photos: padded };
    });
  };

  const handlePhotosDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDropJustEnded(true);
    setFormData((prev) => {
      const current = prev.photos ?? [];
      const entries = buildPhotoDragEntries(current);
      const oldIndex = entries.find((entry) => entry.dragId === String(active.id))?.index ?? -1;
      const newIndex = entries.find((entry) => entry.dragId === String(over.id))?.index ?? -1;

      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }
      const reordered = arrayMove(current, oldIndex, newIndex);
      return { ...prev, photos: reordered };
    });
    setTimeout(() => setDropJustEnded(false), 120);
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handlePhotosDragEnd}
        >
          {(() => {
            const photoDragEntries = buildPhotoDragEntries(photos);
            return (
              <SortableContext
                items={photoDragEntries.map((item) => item.dragId)}
                strategy={rectSortingStrategy}
              >
                <div
                  className="grid grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-[24px]"
                  role="list"
                  aria-label="Profile photo slots"
                >
                  {photos.map((value, i) => {
                    const hasImage = value != null;
                    const isFile = value instanceof File;
                    if (hasImage) {
                      const photoDragId =
                        photoDragEntries.find((entry) => entry.index === i)?.dragId ??
                        `photo:${i}#0`;
                      return (
                        <SortablePhotoUploadCard
                          key={photoDragId}
                          id={photoDragId}
                          slotNumber={i + 1}
                          hasImage
                          file={isFile ? value : null}
                          imageUrl={typeof value === "string" ? value : null}
                          onRemove={() => handleRemove(i)}
                          onUpload={() => handleUploadClick(i)}
                          disableTransition={dropJustEnded}
                        />
                      );
                    }

                    return (
                      <PhotoUploadCard
                        key={i}
                        slotNumber={i + 1}
                        hasImage={false}
                        file={null}
                        imageUrl={null}
                        onRemove={() => handleRemove(i)}
                        onUpload={() => handleUploadClick(i)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            );
          })()}
        </DndContext>
      </div>
    </section>
  );
};
