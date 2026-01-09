"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCascadeInView } from "@/hooks/useCascadeInView";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS =
    ua.includes("Mac") &&
    typeof document !== "undefined" &&
    "ontouchend" in document;
  return iOSDevice || iPadOS;
}

function VideoLoop({ src, className = "", contain = true, rounded = "rounded-3xl" }) {
  const cleanSrc = src.split("?")[0];
  const base = cleanSrc.replace(/\.(webm|mp4|gif)$/i, "");

  const [useGif, setUseGif] = useState(false);

  useEffect(() => {
    setUseGif(isIOS());
  }, []);

  const commonClass =
    `${className} ${rounded} ${contain ? "object-contain" : "object-cover"} block`;

  // ✅ iOS → GIF
  if (useGif) {
    return (
      <img
        src={`${base}.gif`}
        alt=""
        className={commonClass}
        loading="eager"
        decoding="async"
      />
    );
  }

  // ✅ Everyone else → WebM (with image fallback)
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      className={commonClass}
    >
      <source src={`${base}.webm`} type="video/webm" />
      {/* last-resort fallback */}
      <img src={`${base}.gif`} alt="" />
    </video>
  );
}



function SectionNumber({ n, position = "top-right" }) {
  const pos =
    position === "top-right"
      ? "top-3 right-4"
      : position === "right-mid"
      ? "top-1/2 -translate-y-1/2 right-4"
      : "top-3 right-4";

  return (
    <div
      className={`absolute ${pos} text-white/35 font-extrabold text-2xl select-none`}
    >
      {n}
    </div>
  );
}

/**
 * RollingWords (no shift + no bounce + baseline-safe)
 * Desktop + Mobile fix:
 * - lock width + height
 * - re-measure on resize/orientation
 * - re-measure after fonts load (mobile Safari often loads late)
 */
function RollingWords({
  words,
  intervalMs = 1100,
  durationMs = 350,
  className = "",
  slotClassName = "",
}) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [slotW, setSlotW] = useState(null);
  const [slotH, setSlotH] = useState(null);

  const measurerRef = useRef(null);
  const timeoutRef = useRef(null);
  const rafRef = useRef(null);

  const current = words[i];
  const nextIndex = (i + 1) % words.length;
  const next = words[nextIndex];

  const wordsKey = words.join("|");

  const measure = () => {
    if (!measurerRef.current) return;

    // measure after layout has settled
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const spans = measurerRef.current.querySelectorAll("[data-word]");
      let maxW = 0;
      let maxH = 0;

      spans.forEach((s) => {
        const r = s.getBoundingClientRect();
        const w = Math.ceil(r.width);
        const h = Math.ceil(r.height);
        if (w > maxW) maxW = w;
        if (h > maxH) maxH = h;
      });

      setSlotW(maxW || null);
      setSlotH(maxH || null);
    });
  };

  // Initial + whenever words/classes change
  useLayoutEffect(() => {
    measure();
    // Also do a second pass shortly after mount (mobile font/layout settle)
    const t = setTimeout(measure, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsKey, className]);

  // Re-measure on resize/orientation (breakpoint changes)
  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // Re-measure once fonts are ready (prevents late font swap jump)
    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsKey, className]);

  // Word cycling
  useEffect(() => {
    const tick = () => {
      setPhase("animating");
      timeoutRef.current = setTimeout(() => {
        setI(nextIndex);
        setPhase("idle");
      }, durationMs);
    };

    const interval = setInterval(tick, intervalMs);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [intervalMs, durationMs, nextIndex]);

  const transitionClass =
    phase === "animating" ? "transition-all ease-out" : "transition-none";

  return (
    <>
      {/* hidden measurer */}
      <span
        ref={measurerRef}
        className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none whitespace-nowrap"
        aria-hidden="true"
      >
        {words.map((w) => (
          <span key={w} data-word className={className}>
            {w}
          </span>
        ))}
      </span>

      {/* slot */}
      <span
        className={`relative inline-flex align-baseline overflow-hidden whitespace-nowrap ${slotClassName}`}
        style={{
          ...(slotW ? { width: `${slotW}px` } : null),
          ...(slotH ? { height: `${slotH}px` } : null),
        }}
      >
        {/* ghost establishes stable height/baseline */}
        <span className={`relative inline-block ${className} opacity-0`}>
          {current}
        </span>

        {/* current */}
        <span
          className={`absolute left-0 top-0 ${transitionClass} ${
            phase === "animating"
              ? "-translate-y-full opacity-0"
              : "translate-y-0 opacity-100"
          }`}
          style={{
            transitionDuration: `${durationMs}ms`,
            willChange: "transform, opacity",
          }}
        >
          <span className={className}>{current}</span>
        </span>

        {/* next */}
        <span
          className={`absolute left-0 top-0 ${transitionClass} ${
            phase === "animating"
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0"
          }`}
          style={{
            transitionDuration: `${durationMs}ms`,
            willChange: "transform, opacity",
          }}
        >
          <span className={className}>{next}</span>
        </span>
      </span>
    </>
  );
}



export default function HomePage() {
  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  // ✅ keep this (your cascade system)
  useCascadeInView();

  return (
    // ... your JSX continues

    <main className="min-h-screen bg-[color:var(--wandr-wilfred)] text-white overflow-hidden md:overflow-visible">

{/* =========================
    MOBILE (no snapping, NO gradient)
    ========================= */}
<div
  ref={mobileRef}
  className="md:hidden overflow-y-auto [-webkit-overflow-scrolling:touch]"
>
  {/* 1 — HERO */}
  <section className="bg-[color:var(--wandr-wilfred)] px-6 py-12">
    <div
      data-cascade
      style={{
        "--cascade-y": "12px",
        "--cascade-dur": "850ms",
        "--cascade-stagger": "220ms",
      }}
      className="mx-auto max-w-[560px] flex flex-col items-center text-center gap-6"
    >
      <div data-cascade-item style={{ "--i": 0 }}>
        <Image
          src="/wandr-logo-light-1.svg"
          alt="WandR"
          width={320}
          height={110}
          priority
          className="h-auto w-[280px]"
        />
      </div>

      <h1
        data-cascade-item
        className="text-[22px] leading-tight font-extrabold tracking-tight text-white/90"
        style={{ "--i": 1 }}
      >
        We help you{" "}
        <RollingWords
          words={["simplify,", "optimise,", "organise."]}
          intervalMs={900}
          durationMs={260}
          className="text-wandr-rose"
          slotClassName="justify-center"
        />
      </h1>
    </div>
  </section>

  {/* 2 — ADMIN */}
  <section className="bg-[color:var(--wandr-wilfred)] px-6 py-12">
    <div
      data-cascade
      style={{
        "--cascade-y": "12px",
        "--cascade-dur": "850ms",
        "--cascade-stagger": "220ms",
      }}
      className="mx-auto max-w-[560px] flex flex-col items-center text-center gap-6"
    >
      <h2
        data-cascade-item
        className="text-[22px] leading-tight font-extrabold tracking-tight max-w-[28ch]"
        style={{ "--i": 0 }}
      >
        No one starts a business dreaming of admin —
        <span className="text-wandr-rose"> except us.</span>
      </h2>

      <div data-cascade-item style={{ "--i": 1 }} className="w-full flex justify-center">
        <VideoLoop
          src="/mail.webm"
          className="w-full max-w-[420px] h-auto"
          rounded="rounded-3xl"
          contain
        />
      </div>

      <p
        data-cascade-item
        className="text-[18px] leading-snug font-extrabold tracking-tight max-w-[30ch]"
        style={{ "--i": 2 }}
      >
        At <span className="text-wandr-rose">WandR</span>, we help you stay focused
        on your craft — not your inbox.
      </p>
    </div>
  </section>

  {/* 3 — JOURNEY */}
  <section className="bg-[color:var(--wandr-wilfred)] px-6 py-12">
    <div
      data-cascade
      style={{
        "--cascade-y": "12px",
        "--cascade-dur": "850ms",
        "--cascade-stagger": "220ms",
      }}
      className="mx-auto max-w-[560px] flex flex-col items-center text-center gap-6"
    >
      <h2
        data-cascade-item
        className="text-[22px] font-extrabold tracking-tight"
        style={{ "--i": 0 }}
      >
        Every journey is different
      </h2>

      <div data-cascade-item style={{ "--i": 1 }} className="w-full flex justify-center">
        <VideoLoop
          src="/car-swerve.webm"
          className="w-full max-w-[520px] h-auto"
          rounded="rounded-3xl"
          contain
        />
      </div>

      <p
        data-cascade-item
        className="text-[18px] leading-snug font-extrabold tracking-tight max-w-[36ch]"
        style={{ "--i": 2 }}
      >
        we’re here to make yours
        <br />
        easier to navigate.
      </p>

      <p
        data-cascade-item
        className="text-sm leading-relaxed text-white/80 max-w-[40ch]"
        style={{ "--i": 3 }}
      >
        At <span className="font-semibold">WandR</span>, we turn structure into an
        art form, giving you the space to focus on what you do best while we take
        care of the rest.
      </p>
    </div>
  </section>

  {/* 4 — SERVICES */}
  <section className="bg-[color:var(--wandr-wilfred)] px-6 py-12">
    <div className="mx-auto max-w-[560px] flex flex-col gap-10">
      <article
        data-cascade
        style={{
          "--cascade-y": "12px",
          "--cascade-dur": "850ms",
          "--cascade-stagger": "140ms",
        }}
        className="flex flex-col items-center text-center"
      >
        <div data-cascade-item style={{ "--i": 0 }} className="w-full flex justify-center">
          <VideoLoop
            src="/admin.webm"
            className="w-full max-w-[360px] h-auto"
            rounded="rounded-none"
            contain
          />
        </div>

        <h3
          data-cascade-item
          className="mt-4 text-[22px] font-extrabold tracking-tight"
          style={{ "--i": 1 }}
        >
          Virtual <span className="text-wandr-rose">Assistance</span>
        </h3>

        <p
          data-cascade-item
          className="mt-2 text-sm text-white/80 leading-relaxed max-w-[44ch]"
          style={{ "--i": 2 }}
        >
          Reliable, detail-driven administrative support to keep your business
                  running smoothly — from inbox and calendar management to client
                  communication and travel planning..
        </p>
      </article>

      <div className="h-px w-full bg-white/15" />

      <article
        data-cascade
        style={{
          "--cascade-y": "12px",
          "--cascade-dur": "850ms",
          "--cascade-stagger": "140ms",
        }}
        className="flex flex-col items-center text-center"
      >
        <div data-cascade-item style={{ "--i": 0 }} className="w-full flex justify-center">
          <VideoLoop
            src="/timeline-3.webm"
            className="w-full max-w-[400px] h-auto"
            rounded="rounded-none"
            contain
          />
        </div>

        <h3
          data-cascade-item
          className="mt-4 text-[22px] font-extrabold tracking-tight"
          style={{ "--i": 1 }}
        >
          Project <span className="text-wandr-rose">Management</span>
        </h3>

        <p
          data-cascade-item
          className="mt-2 text-sm text-white/80 leading-relaxed max-w-[44ch]"
          style={{ "--i": 2 }}
        >
          Stay on track from concept to completion. We manage scheduling, key milestones, and communication with precision, ensuring your ideas never get lost in logistics.
        </p>
      </article>
    </div>
  </section>

  {/* 5 — EXPERIENCE */}
  <section className="bg-wandr-joyce px-6 py-12">
    <div
      data-cascade
      style={{
        "--cascade-y": "12px",
        "--cascade-dur": "850ms",
        "--cascade-stagger": "180ms",
      }}
      className="mx-auto max-w-[560px] flex flex-col items-center text-center gap-6"
    >
      <div data-cascade-item style={{ "--i": 0 }} className="text-[54px] font-black leading-none tracking-tight">
        15+
        <span className="block mt-2 text-[48px] font-semibold opacity-90">
          Years
        </span>
      </div>

      <p data-cascade-item className="text-sm leading-relaxed text-white/80 max-w-[44ch]" style={{ "--i": 1 }}>
        After more than <span className="font-semibold text-white">15 years</span>{" "}
        working for <span className="font-semibold text-white">FMCG</span> and{" "}
        <span className="font-semibold text-white">creative advertising agencies</span>,
        we understand the rhythm of projects and what drives them forward.
      </p>

      <div data-cascade-item style={{ "--i": 2 }} className="w-full flex justify-center">
        <VideoLoop
          src="/car-road-2.webm"
          className="w-full max-w-[480px] h-auto"
          rounded="rounded-xl"
          contain
        />
      </div>
    </div>
  </section>

  {/* 6 — PATH */}
  <section className="bg-wandr-rose px-6 py-12">
    <div
      data-cascade
      style={{
        "--cascade-y": "12px",
        "--cascade-dur": "850ms",
        "--cascade-stagger": "180ms",
      }}
      className="mx-auto max-w-[560px] flex flex-col items-center text-center gap-6"
    >
      <h2
        data-cascade-item
        className="font-extrabold leading-[1.1] text-[22px] max-w-[32ch] text-[color:var(--wandr-joyce)]"
        style={{ "--i": 0 }}
      >
        Every path is unique — unpredictable
        <br />
        and always evolving
      </h2>

      <div data-cascade-item style={{ "--i": 1 }} className="w-full flex justify-center">
        <VideoLoop
          src="/flying-car.webm"
          className="w-full max-w-[520px] h-auto"
          rounded="rounded-3xl"
          contain
        />
      </div>

      <p
        data-cascade-item
        className="font-extrabold leading-tight text-[18px] max-w-[34ch] text-[color:var(--wandr-joyce)]"
        style={{ "--i": 2 }}
      >
        Our role is to help you find clarity in the clutter and bring structure
        to wherever your creativity wanders.
      </p>
    </div>
  </section>

  {/* 7 — CONTACT */}
  <section className="bg-[color:var(--wandr-wilfred)] px-6 py-12">
    <div
      data-cascade
      style={{
        "--cascade-y": "12px",
        "--cascade-dur": "850ms",
        "--cascade-stagger": "180ms",
      }}
      className="mx-auto max-w-[560px] flex flex-col items-center text-center gap-6"
    >
      <p data-cascade-item className="max-w-[46ch] text-[14px] text-white/75" style={{ "--i": 0 }}>
        If you’re ready to simplify your refocus on what you love creating. WandR can help you find your rhythm and direction again.
      </p>

      <a
        data-cascade-item
        href="mailto:hello@wandr.com"
        className="w-full max-w-[360px] bg-white text-black font-extrabold tracking-wide py-4 rounded-xl"
        style={{ "--i": 1 }}
      >
        CONTACT US
      </a>

      <div data-cascade-item style={{ "--i": 2 }}>
        <Image
          src="/wandr-logo-light-1.svg"
          alt="WandR"
          width={320}
          height={110}
          priority
          className="h-auto w-[280px]"
        />
      </div>
    </div>
  </section>
</div>
{/* ===== END MOBILE ===== */}



{/* =========================
    DESKTOP (custom snapping)
    ========================= */}
<div ref={desktopRef} className="hidden md:block h-screen overflow-y-auto">
  {/* 1 — HERO */}
  <section
    data-snap
    className="h-[100svh] max-[1440px]:h-[100dvh] max-[1440px]:min-h-[720px] flex items-center bg-[color:var(--wandr-wilfred)]"
  >
    <div className="mx-auto max-w-6xl w-full px-14 lg:px-20 py-12 flex items-center gap-10 max-[1440px]:gap-8">
      <Image
        src="/wandr-logo-light-1.svg"
        alt="WandR"
        width={480}
        height={160}
        priority
        className="h-auto w-[420px] max-w-full max-[1440px]:w-[360px]"
      />

      <h1 className="ml-auto text-right text-[34px] max-[1440px]:text-[28px] leading-tight font-extrabold tracking-normal text-white whitespace-nowrap">
        We help you{" "}
        <RollingWords
          words={["simplify,", "optimise,", "organise."]}
          intervalMs={900}
          durationMs={260}
          className="text-wandr-rose"
          slotClassName="justify-end"
        />
      </h1>
    </div>
  </section>


  {/* 2+3 — ADMIN + JOURNEY (COMBINED 2x2, FULL-BLEED ROW BACKGROUNDS) */}
  <section
    data-snap
    className="h-[100svh] max-[1440px]:h-[100dvh] max-[1440px]:min-h-[720px]"
  >
    <div className="h-full grid grid-rows-2">
      {/* Row 1 (Wilfred) */}
      <div className="bg-[color:var(--wandr-wilfred)]">
        <div className="h-full flex items-center">
          <div className="mx-auto max-w-6xl w-full px-6 lg:px-20 py-10 max-[1440px]:py-8">
            <div className="grid grid-cols-2 items-center gap-12 max-[1440px]:gap-8">
              {/* Left — Mail anim */}
              <div className="flex items-center justify-center">
                <VideoLoop
                  src="/mail.webm"
                  className="w-full max-w-[520px] max-[1440px]:max-w-[440px] h-auto"
                  rounded="rounded-3xl"
                  contain
                />
              </div>

              {/* Right — Admin copy */}
              <div className="flex items-center justify-start">
                <div className="max-w-[34ch] text-left">
                  <h2 className="text-[34px] max-[1440px]:text-[28px] leading-tight font-extrabold tracking-normal text-white">
                    No one starts a business dreaming of admin —
                    <span className="text-wandr-rose"> except us.</span>
                  </h2>

                  <p className="mt-6 max-[1440px]:mt-4 text-[18px] max-[1440px]:text-[16px] leading-relaxed text-white/85">
                    At <span className="font-semibold text-white">WandR</span>, we help you stay
                    focused on your craft — not your inbox.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 (Dark teal) */}
      <div className="bg-[#163f3f]">
        <div className="h-full flex items-center">
          <div className="mx-auto max-w-6xl w-full px-6 lg:px-20 py-10 max-[1440px]:py-8">
            <div className="grid grid-cols-2 items-center gap-12 max-[1440px]:gap-8">
              {/* Left — Journey copy */}
              <div className="flex items-center justify-center text-right">
                <div className="max-w-[38ch]">
                  <h2 className="text-[40px] max-[1440px]:text-[32px] font-extrabold tracking-[-0.02em] leading-tight text-white">
                    Every journey
                    <br />
                    is <span className="text-wandr-rose">different</span>
                  </h2>

                  <p className="mt-6 max-[1440px]:mt-4 text-[22px] max-[1440px]:text-[18px] font-extrabold tracking-normal text-white">
                    we’re here to make yours
                    <br />
                    easier to navigate.
                  </p>

                  <p className="mt-6 max-[1440px]:mt-4 text-sm max-[1440px]:text-[13px] leading-relaxed text-white/80">
                    At <span className="font-semibold text-white">WandR</span>, we turn structure into an art form,
                    giving you the space to focus on what you do best while we take care of the rest.
                  </p>
                </div>
              </div>

              {/* Right — Car-swerve anim */}
              <div className="flex items-center justify-right">
                <VideoLoop
                  src="/car-swerve.webm"
                  className="w-full max-w-[780px] max-[1440px]:max-w-[620px] h-auto"
                  rounded="rounded-3xl"
                  contain
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

{/* 4+5 — SERVICES + EXPERIENCE (COMBINED 2x2, FULL-BLEED ROW BACKGROUNDS) */}
<section
  data-snap
  className="h-[100svh] max-[1440px]:h-[100dvh] max-[1440px]:min-h-[720px]"
>
  {/* Row 1 (Wilfred) */}
  <div className="bg-[color:var(--wandr-wilfred)]">
    <div className="h-full flex items-center">
      <div className="mx-auto max-w-6xl w-full px-6 lg:px-20 py-10 max-[1440px]:py-8">
        <div className="grid grid-cols-2 items-center gap-12 max-[1440px]:gap-8">
          {/* Left — Virtual Assistance */}
          <div className="flex items-center justify-center text-right">
            <div className="max-w-[38ch]">
              <VideoLoop
                src="/admin.webm"
                className="w-[380px] max-[1440px]:w-[280px] h-auto mx-auto mb-6 max-[1440px]:mb-4"
                rounded="rounded-none"
                contain
              />

              {/* ✅ text nudge wrapper */}
              <div className="-mt-[6px] max-[1440px]:-mt-[4px]">
                <h3 className="text-[34px] max-[1440px]:text-[28px] font-extrabold tracking-tight mb-3 max-[1440px]:mb-2 text-white">
                  Virtual <span className="text-wandr-rose">Assistance</span>
                </h3>
                <p className="text-sm max-[1440px]:text-[13px] text-white/80 leading-relaxed">
                  Reliable, detail-driven administrative support to keep your business
                  running smoothly — from inbox and calendar management to client
                  communication and travel planning..
                </p>
              </div>
            </div>
          </div>

          {/* Right — Project Management */}
          <div className="flex items-center justify-left text-left">
            {/* ✅ only change here: shift this whole text “box” LEFT a bit without shrinking it */}
            <div className="max-w-[38ch] relative -left-[18px] max-[1440px]:-left-[12px]">
              <VideoLoop
                src="/timeline-3.webm"
                className="w-[420px] max-[1440px]:w-[280px] h-auto mx-auto mb-6 max-[1440px]:mb-4"
                rounded="rounded-none"
                contain
              />

              {/* ✅ text nudge wrapper */}
              <div className="-mt-[6px] max-[1440px]:-mt-[4px]">
                <h3 className="text-[34px] max-[1440px]:text-[28px] font-extrabold tracking-tight mb-3 max-[1440px]:mb-2 text-white">
                  Project <span className="text-wandr-rose">Management</span>
                </h3>
                <p className="text-sm max-[1440px]:text-[13px] text-white/80 leading-relaxed">
                  Stay on track from concept to completion. We manage scheduling, key
                  milestones, and communication with precision, ensuring your ideas
                  never get lost in logistics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

{/* Row 2 (Dark teal) */}
<section className="bg-[#163f3f] min-h-screen items-center overflow-hidden">
  <div className="mx-auto max-w-6xl w-full px-6 lg:px-20 py-20 max-[1440px]:py-16">
    <div className="grid grid-cols-2 items-center gap-0">

      {/* Left — keep your original alignment */}
      <div className="flex items-center justify-center text-right pr-12 max-[1440px]:pr-8">
        <div className="max-w-[38ch]">
          <div className="text-[58px] max-[1440px]:text-[48px] font-black leading-none tracking-tight text-white">
            15+ <span className="font-semibold text-white/90">Years</span>
          </div>

          <p className="mt-6 max-[1440px]:mt-4 text-[16px] max-[1440px]:text-[14px] leading-[2.0] max-[1440px]:leading-[1.8] text-white/85">
            After more than <span className="font-semibold text-white">15 years</span> working for{" "}
            <span className="font-semibold text-white">FMCG</span> and{" "}
            <span className="font-semibold text-white">creative advertising agencies</span>, we understand the rhythm
            of projects and what drives them forward: the long hours, shifting priorities, and constant movement between
            inspiration and delivery.
          </p>
        </div>
      </div>

      {/* Right — Car road anim */}
      <div className="flex items-left justify-start pr-10 max-[1440px]:pl-2">
        <div className="w-full max-w-[850px] max-[1440px]:max-w-[480px] h-[280px] max-[1440px]:h-[220px] overflow-hidden">
          <VideoLoop
            src="/car-road-2.webm"
            className="w-[350px]] h-full"
            rounded="rounded-xl"
            contain
          />
        </div>
      </div>

    </div>
  </div>
</section>


</section>




  {/* 6 — PATH */}
  <section
    data-snap
    className="h-[100svh] max-[1440px]:h-[100dvh] max-[1440px]:min-h-[720px] bg-[color:var(--wandr-rose)] px-6 flex items-center"
  >
    <div className="mx-auto max-w-6xl w-full flex flex-col items-center text-center gap-12 max-[1440px]:gap-8">
      <h2 className="text-[34px] max-[1440px]:text-[28px] font-extrabold text-[color:var(--wandr-joyce)]">
        Every path is unique — unpredictable
        <br />
        and always evolving
      </h2>

      <VideoLoop
        src="/flying-car.webm"
        className="w-[720px] h-[360px] max-[1440px]:w-[560px] max-[1440px]:h-[280px]"
      />

      <p className="text-[34px] max-[1440px]:text-[28px] font-extrabold max-w-[36ch] text-[color:var(--wandr-joyce)]">
        Our role is to bring clarity to wherever your creativity wanders.
      </p>
    </div>
  </section>

  {/* 7 — CONTACT */}
  <section
    data-snap
    className="h-[100svh] max-[1440px]:h-[100dvh] max-[1440px]:min-h-[720px] px-6 flex items-center bg-[color:var(--wandr-wilfred)]"
  >
    <div className="mx-auto max-w-6xl w-full flex flex-col items-center text-center gap-6 max-[1440px]:gap-5">
      <p className="max-w-[52ch] text-xs max-[1440px]:text-[12px] text-white/75">
        If you’re ready to simplify your refocus on what you love creating. WandR can help you find your rhythm and direction again.
      </p>

      <a
        href="mailto:hello@wandr.com"
        className="w-full max-w-[360px] bg-white text-black font-extrabold py-4 rounded-xl"
      >
        CONTACT US
      </a>

      <Image
        src="/wandr-logo-light-1.svg"
        alt="WandR"
        width={320}
        height={110}
        className="w-[350px] max-[1440px]:w-[300px] h-auto"
      />
    </div>
  </section>
</div>


    </main>
  );
}
