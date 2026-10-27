import { memo } from "react";
import { Check, CircleX, Info, X } from "lucide-react";

const ICONS = { success: Check, error: CircleX, info: Info };

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = ICONS[toast.type] || Check;
  return (
    <div className={`em-toast ${toast.type}`} role={toast.type === "error" ? "alert" : "status"}>
      <Icon size={17} />
      {toast.message}
      <button onClick={onClose} aria-label="Dismiss notification"><X size={15} /></button>
    </div>
  );
}
export default memo(Toast);
