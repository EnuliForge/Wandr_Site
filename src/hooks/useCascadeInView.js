"use client";

import { useEffect } from "react";

export function useCascadeInView() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-cascade]"));
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}


console.log("useCascadeInView loaded")
