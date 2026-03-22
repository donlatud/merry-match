import InputBar from "./input/InputBar";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({
  item,
  index,
  totalItems,
  onUpdate,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isError = item.value.trim() === "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-500 select-none"
      >
        ⋮⋮
      </div>

      <div className="flex-1">
        <InputBar
          value={item.value}
          onChange={(e) =>
            onUpdate(item.id, e.target.value)
          }
          placeholder={`Detail ${index + 1}`}
          error={isError}
        />
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={totalItems === 1}
        className={`text-red-500 ${
          totalItems === 1
            ? "opacity-40 cursor-not-allowed"
            : "cursor-pointer"
        }`}
      >
        Delete
      </button>
    </div>
  );
}

export default SortableItem;