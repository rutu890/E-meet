import { useCallback, useEffect, useRef, useState } from "react";
import { playTone } from "../utils/feedback";

const TONE = { success: "success", error: "error", info: "pop" };

export function useToast(duration = 2800) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const hide = useCallback(() => { clearTimeout(timer.current); setToast(null); }, []);
  const show = useCallback((message, type = "success") => {
    clearTimeout(timer.current);
    setToast({ message, type, id: Date.now() });
    playTone(TONE[type] || "success");
    timer.current = setTimeout(() => setToast(null), duration);
  }, [duration]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { toast, show, hide };
}
