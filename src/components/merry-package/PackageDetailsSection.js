import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { nanoid } from "nanoid";
import { SecondaryButton } from "@/components/commons/button/SecondaryButton";
import SortableItem from "@/components/commons/SortableItem";

function PackageDetailsSection({ details, setDetails }) {
  const addDetail = () => {
    setDetails((prev) => [...prev, { id: nanoid(), value: "" }]);
  };

  const removeDetail = (id) => {
    setDetails((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateDetail = (id, value) => {
    setDetails((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, value } : item
      )
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDetails((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const hasError = details.some((d) => d.value.trim() === "");

  return (
    <>
      <h1 className="text-body1 text-gray-700">Package Detail</h1>

      <div className="flex flex-col gap-6">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={details.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {details.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-6">
                <h1 className="px-7">
                  Detail &nbsp;
                  {index === 0 && (
                    <span className="text-red-500">*</span>
                  )}
                </h1>

                <SortableItem
                  item={item}
                  index={index}
                  totalItems={details.length}
                  onUpdate={updateDetail}
                  onRemove={removeDetail}
                />
              </div>
            ))}
          </SortableContext>
        </DndContext>

        <SecondaryButton
          type="button"
          onClick={addDetail}
          className="w-35 text-red-600 font-bold cursor-pointer mx-7"
        >
          + Add detail
        </SecondaryButton>

        {hasError && (
          <p className="text-red-500 text-sm mx-7">
            All detail fields are required.
          </p>
        )}
      </div>
    </>
  );
}

export default PackageDetailsSection;