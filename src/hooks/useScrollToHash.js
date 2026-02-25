import { useEffect } from "react";
import { useRouter } from "next/router";

const DEFAULT_SCROLL_OFFSET_PX = 64;
const DEFAULT_ALLOWED_HASHES = ["why-merry-match", "how-to-merry"];
const DEFAULT_DELAY_MS = 150;

export const useScrollToHash = (options = {}) => {
  const router = useRouter();

  const {
    allowedHashes = DEFAULT_ALLOWED_HASHES,
    offsetPx = DEFAULT_SCROLL_OFFSET_PX,
    delayMs = DEFAULT_DELAY_MS,
  } = options;

  useEffect(() => {
    const fromRouter = router.asPath.split("#")[1];
    const fromWindow =
      typeof window !== "undefined"
        ? (window.location.hash || "").replace("#", "")
        : "";

    const hash = fromRouter || fromWindow;
    if (!hash || !allowedHashes.includes(hash)) return;

    const t = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        const top =
          el.getBoundingClientRect().top + window.scrollY - offsetPx;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, delayMs);

    return () => clearTimeout(t);
  }, [router.asPath, allowedHashes, offsetPx, delayMs]);
};

