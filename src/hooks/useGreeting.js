import { useEffect, useState } from "react";

function greetingFor(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Hello";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// Re-checks every minute so the greeting flips while the page stays open.
export function useGreeting() {
  const [greeting, setGreeting] = useState(greetingFor);
  useEffect(() => {
    const id = setInterval(() => setGreeting(greetingFor()), 60000);
    return () => clearInterval(id);
  }, []);
  return greeting;
}
