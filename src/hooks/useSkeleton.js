import { useEffect, useState } from "react";

// Demo loader. When you connect a real API, replace this with the request's own `loading` flag.
export function useSkeleton(ms = 500) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const id = setTimeout(() => setLoading(false), ms); return () => clearTimeout(id); }, [ms]);
  return loading;
}
