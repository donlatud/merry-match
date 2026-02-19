import { Toast } from "./Toast";
import { toast } from "sonner";

const successStyle = {
  bgClass: "bg-green-100",
  borderClass: "border-green-500/30",
  iconBgClass: "bg-green-500/15",
  accentClass: "from-green-500 to-green-500",
  progressClass: "from-green-500 to-green-100",
};

const errorStyle = {
  bgClass: "bg-red-100",
  borderClass: "border-red-300",
  iconBgClass: "bg-red-200/60",
  accentClass: "from-red-400 to-red-600",
  progressClass: "from-red-600 to-red-400",
};
export const merryToast = {
  success: (title, description, icon) =>
    toast.custom(
      (t) => (
        <Toast
          t={t}
          title={title}
          description={description}
          icon={icon}
          {...successStyle}
        />
      ),
      { duration: 4000 },
    ),

  error: (title, description, icon) =>
    toast.custom(
      (t) => (
        <Toast
          t={t}
          title={title}
          description={description}
          icon={icon}
          {...errorStyle}
        />
      ),
      { duration: 4000 },
    ),
};
