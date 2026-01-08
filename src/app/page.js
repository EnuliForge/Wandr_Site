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

  const measurerRef = useRef(null);
  const timeoutRef = useRef(null);

  const current = words[i];
  const nextIndex = (i + 1) % words.length;
  const next = words[nextIndex];

  const wordsKey = words.join("|");

  useLayoutEffect(() => {
    if (!measurerRef.current) return;
    const spans = measurerRef.current.querySelectorAll("[data-word]");
    let max = 0;
    spans.forEach((s) => {
      const w = Math.ceil(s.getBoundingClientRect().width);
      if (w > max) max = w;
    });
    setSlotW(max);
  }, [wordsKey, className]);

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
        style={slotW ? { width: `${slotW}px` } : undefined}
      >
        {/* ghost establishes baseline/height */}
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
          style={{ transitionDuration: `${durationMs}ms` }}
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
          style={{ transitionDuration: `${durationMs}ms` }}
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

  // ✅ new cascade system (viewport-based)
  useCascadeInView();

  // ✅ desktop snap effect (unchanged)
  useEffect(() => {
    const el = desktopRef.current;
    if (!el) return;

    const sections = Array.from(el.querySelectorAll("[data-snap]"));
    if (sections.length === 0) return;

    let isAnimating = false;
    let lastWheelTime = 0;

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScrollTo = (targetTop, duration = 950) => {
      const startTop = el.scrollTop;
      const diff = targetTop - startTop;
      if (Math.abs(diff) < 2) return;

      isAnimating = true;
      const start = performance.now();

      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = easeInOutCubic(t);
        el.scrollTop = startTop + diff * eased;

        if (t < 1) requestAnimationFrame(step);
        else isAnimating = false;
      };

      requestAnimationFrame(step);
    };

    const getClosestSectionIndex = () => {
      const y = el.scrollTop;
      let best = 0;
      let bestDist = Infinity;

      for (let i = 0; i < sections.length; i++) {
        const top = sections[i].offsetTop;
        const dist = Math.abs(top - y);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      return best;
    };

    const goTo = (dir) => {
      const i = getClosestSectionIndex();
      const next = Math.max(0, Math.min(sections.length - 1, i + dir));
      animateScrollTo(sections[next].offsetTop, 950);
    };

    const onWheel = (e) => {
      if (isAnimating) {
        e.preventDefault();
        return;
      }

      const now = Date.now();
      const delta = e.deltaY;

      if (Math.abs(delta) < 18) return;

      if (now - lastWheelTime < 850) {
        e.preventDefault();
        return;
      }

      lastWheelTime = now;
      e.preventDefault();

      goTo(delta > 0 ? 1 : -1);
    };

    const onKeyDown = (e) => {
      if (isAnimating) return;

      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goTo(1);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goTo(-1);
      }
      if (e.key === "Home") {
        e.preventDefault();
        animateScrollTo(0, 950);
      }
      if (e.key === "End") {
        e.preventDefault();
        const last = sections[sections.length - 1];
        animateScrollTo(last.offsetTop, 950);
      }
    };

    el.setAttribute("tabindex", "0");
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("keydown", onKeyDown);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    // ... your JSX continues

    <main className="min-h-screen bg-[color:var(--wandr-wilfred)] text-white overflow-hidden md:overflow-visible">

     {/* =========================
    MOBILE VERSION (synced to desktop refs)
    ========================= */}
<div
  ref={mobileRef}
  className="md:hidden h-[100svh] overflow-y-auto snap-y snap-proximity snap-ease [-webkit-overflow-scrolling:touch]"
>

  {/* 1 — HERO (mobile + RollingWords) */}
  <section className="relative min-h-[100svh] px-6 py-16 flex flex-col justify-center snap-center snap-always bg-wandr-wilfred-gradient">

    <div
      data-cascade
      style={{
        "--cascade-y": "14px",
        "--cascade-dur": "900ms",
        "--cascade-stagger": "350ms",
      }}
      className="flex flex-col items-center text-center gap-8"
    >
      <div data-cascade-item className="flex flex-col items-center" style={{ "--i": 0 }}>
        <Image
          src="/wandr-logo-light-1.svg"
          alt="WandR"
          width={320}
          height={110}
          priority
          className="h-auto w-[350px]"
        />
      </div>

      <h1
        data-cascade-item
        className="text-[22px] leading-tight font-extrabold tracking-tight text-white/90 whitespace-nowrap"
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

  {/* 2 — ADMIN (mail.webm) */}
  <section className="relative min-h-[100svh] px-6 py-16 flex flex-col justify-center snap-center snap-always bg-wandr-wilfred-gradient">

    <div
      data-cascade
      style={{
        "--cascade-y": "14px",
        "--cascade-dur": "900ms",
        "--cascade-stagger": "350ms",
      }}
      className="flex flex-col items-center text-center gap-10"
    >
      <h2
        data-cascade-item
        className="text-[22px] leading-tight font-extrabold tracking-tight max-w-[28ch]"
        style={{ "--i": 0 }}
      >
        No one starts a business dreaming of admin —
        <span className="text-wandr-rose"> except us.</span>
      </h2>

      <div data-cascade-item style={{ "--i": 1 }}>
        <VideoLoop
          src="/mail.webm"
          className="w-[350px] h-auto"
          rounded="rounded-3xl"
          contain
        />
      </div>

      <p
        data-cascade-item
        className="text-[22px] leading-snug font-extrabold tracking-tight max-w-[26ch]"
        style={{ "--i": 2 }}
      >
        At <span className="text-wandr-rose">WandR</span>, we help you stay focused
        on your craft — not your inbox.
      </p>
    </div>
  </section>

  {/* 3 — JOURNEY (car-swerve.webm) */}
  <section className="relative min-h-[100svh] px-6 py-16 flex flex-col justify-center snap-center snap-always bg-wandr-wilfred-gradient">

    <div
      data-cascade
      style={{
        "--cascade-y": "14px",
        "--cascade-dur": "900ms",
        "--cascade-stagger": "350ms",
      }}
      className="flex flex-col items-center text-center gap-8"
    >
      <h2
        data-cascade-item
        className="text-[22px] font-extrabold tracking-tight"
        style={{ "--i": 0 }}
      >
        Every journey is different
      </h2>

      <div data-cascade-item style={{ "--i": 1 }}>
        <VideoLoop
          src="/car-swerve.webm"
          className="w-full max-w-[520px] h-[240px]"
          rounded="rounded-3xl"
          contain
        />
      </div>

      <p
        data-cascade-item
        className="text-[22px] leading-snug font-extrabold tracking-tight max-w-[45ch]"
        style={{ "--i": 2 }}
      >
        we’re here to make yours
        <br />
        easier to navigate.
      </p>

      <p
        data-cascade-item
        className="text-sm leading-relaxed text-white/80 max-w-[35ch]"
        style={{ "--i": 3 }}
      >
        At <span className="font-semibold">WandR</span>, we turn structure into an
        art form, giving you the space to focus on what you do best while we take
        care of the rest.
      </p>
    </div>
  </section>

  {/* 4 — SERVICES (admin + timeline) */}
  <section className="relative min-h-[100svh] px-6 py-16 flex flex-col justify-center snap-center snap-always bg-wandr-wilfred-gradient">

    <div className="flex flex-col gap-14">
      <article className="flex flex-col items-center text-center">
        <div
          data-cascade
          style={{
            "--cascade-y": "12px",
            "--cascade-dur": "850ms",
            "--cascade-stagger": "110ms",
          }}
          className="flex flex-col items-center text-center"
        >
          <div data-cascade-item style={{ "--i": 0 }}>
            <VideoLoop
              src="/admin.webm"
              className="w-[320px] h-auto mb-6"
              rounded="rounded-none"
              contain
            />
          </div>

          <h3
            data-cascade-item
            className="text-[22px] font-extrabold tracking-tight mb-3"
            style={{ "--i": 1 }}
          >
            Virtual <span className="text-wandr-rose">Assistance</span>
          </h3>

          <p
            data-cascade-item
            className="text-sm text-white/80 leading-relaxed max-w-[38ch]"
            style={{ "--i": 2 }}
          >
            Inbox, admin, scheduling, documents, follow-ups — we handle the busywork
            so you can stay in flow.
          </p>
        </div>
      </article>

      <div className="h-px w-full bg-white/25" />

      <article className="flex flex-col items-center text-center">
        <div
          data-cascade
          style={{
            "--cascade-y": "12px",
            "--cascade-dur": "850ms",
            "--cascade-stagger": "110ms",
          }}
          className="flex flex-col items-center text-center"
        >
          <div data-cascade-item style={{ "--i": 0 }}>
            <VideoLoop
              src="/timeline.webm"
              className="w-[340px] h-auto mb-6"
              rounded="rounded-none"
              contain
            />
          </div>

          <h3
            data-cascade-item
            className="text-[22px] font-extrabold tracking-tight mb-3"
            style={{ "--i": 1 }}
          >
            Project <span className="text-wandr-rose">Management</span>
          </h3>

          <p
            data-cascade-item
            className="text-sm text-white/80 leading-relaxed max-w-[38ch]"
            style={{ "--i": 2 }}
          >
            Timelines, coordination, client comms, deliverables — we keep projects
            organised and moving forward.
          </p>
        </div>
      </article>
    </div>
  </section>

  {/* 5 — EXPERIENCE (car-road.webm) */}
  <section className="relative min-h-[100svh] px-6 py-16 flex flex-col justify-center snap-center snap-always bg-wandr-joyce">

    <div
      data-cascade
      style={{
        "--cascade-y": "14px",
        "--cascade-dur": "850ms",
        "--cascade-stagger": "110ms",
      }}
      className="flex flex-col items-center text-center gap-6"
    >
      <div
        data-cascade-item
        className="text-[64px] font-black leading-none tracking-tight"
        style={{ "--i": 0 }}
      >
        15+
        <span className="block mt-2 text-[64px] font-semibold opacity-90">
          Years
        </span>
      </div>

      <p
        data-cascade-item
        className="text-sm leading-relaxed text-white/80 max-w-[35ch]"
        style={{ "--i": 1 }}
      >
        After more than <span className="font-semibold text-white">15 years</span>{" "}
        working for <span className="font-semibold text-white">FMCG</span> and{" "}
        <span className="font-semibold text-white">creative advertising agencies</span>,
        we understand the rhythm of projects and what drives them forward.
      </p>

      <div data-cascade-item style={{ "--i": 2 }}>
        <VideoLoop
          src="/car-road.webm"
          className="w-full max-w-[450px] h-auto"
          rounded="rounded-xl"
          contain
        />
      </div>
    </div>
  </section>

  {/* 6 — PATH (flying-car.webm) */}
  <section className="relative min-h-[100svh] px-6 py-16 flex flex-col justify-center snap-center snap-always bg-wandr-rose">

    <div
      data-cascade
      style={{
        "--cascade-y": "12px",
        "--cascade-dur": "850ms",
        "--cascade-stagger": "110ms",
      }}
      className="flex flex-col items-center text-center"
    >
      <h2
        data-cascade-item
        className="font-extrabold tracking-normal leading-[1.1] text-[22px] text-center mx-auto max-w-[30ch] text-[color:var(--wandr-joyce)]"
        style={{ "--i": 0 }}
      >
        Every path is unique — unpredictable
        <br />
        and always evolving
      </h2>

      <div
        data-cascade-item
        className="mt-10 flex items-center justify-center"
        style={{ "--i": 1 }}
      >
        <VideoLoop
          src="/flying-car.webm"
          className="w-full max-w-[560px] h-[240px]"
          rounded="rounded-3xl"
          contain
        />
      </div>

      <p
        data-cascade-item
        className="mt-10 font-extrabold tracking-normal leading-tight text-[22px] text-center max-w-[30ch] mx-auto text-[color:var(--wandr-joyce)]"
        style={{ "--i": 2 }}
      >
        Our role is to help you find clarity in the clutter and to bring structure
        to wherever your creativity wanders.
      </p>
    </div>
  </section>

  {/* 7 — CONTACT */}
  <section className="relative min-h-[100svh] px-6 py-16 flex flex-col justify-center snap-center snap-always">

    <div
      data-cascade
      style={{
        "--cascade-y": "12px",
        "--cascade-dur": "850ms",
        "--cascade-stagger": "110ms",
      }}
      className="mx-auto max-w-6xl flex flex-col items-center text-center gap-6"
    >
      <p
        data-cascade-item
        className="max-w-[52ch] text-[15px] text-white/75"
        style={{ "--i": 0 }}
      >
        If you’re ready to simplify your workload and protect your focus, reach
        out and let’s build a system that supports you.
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
          className="h-auto w-[350px]"
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
          className="md:min-h-[850px] lg:min-h-[900px] px-6 flex items-center"
        >
          <div className="mx-auto max-w-6xl w-full flex items-center justify-between gap-10">
            <div className="flex flex-col justify-center">
              <Image
                src="/wandr-logo-light-1.svg"
                alt="WandR"
                width={480}
                height={160}
                priority
                className="h-auto w-[420px] max-w-full"
              />
            </div>

            <h1 className="text-right text-[34px] leading-tight font-extrabold tracking-normal text-white whitespace-nowrap">
              We help you{" "}
              <RollingWords
                words={["simplify,", "optimise,", "organise."]}
                intervalMs={900} // ~0.9s per word
                durationMs={260} // quick slide
                className="text-wandr-rose"
                slotClassName="justify-end"
              />
            </h1>
          </div>
        </section>

        {/* 2 — ADMIN (mail.webm) */}
        <section
          data-snap
          className="md:min-h-[850px] lg:min-h-[900px] px-6 flex items-center"
        >
          <div className="mx-auto max-w-6xl w-full grid gap-10 grid-cols-[1.2fr_1fr_1fr] items-center">
            <h2 className="text-[34px] leading-tight font-extrabold tracking-normal">
              No one starts a business dreaming of admin —
              <span className="text-wandr-rose"> except us.</span>
            </h2>

            {/* OFFSET LEFT: use negative translate-x */}
            <div className="w-[520px] h-auto -translate-x-[80px]">
              <VideoLoop
                src="/mail.webm"
                className="h-auto w-[520px] max-w-full"
                rounded="rounded-3xl"
                contain
              />
            </div>

            <p className="text-[34px] leading-tight font-extrabold tracking-normal">
              At <span className="text-wandr-rose">WandR</span>, we help you stay
              focused on your craft — not your inbox.
            </p>
          </div>
        </section>

        {/* 3 — JOURNEY (flying-car.webm) */}
        <section
          data-snap
          className="md:min-h-[850px] lg:min-h-[900px] px-6 flex items-center"
        >
          <div className="mx-auto max-w-6xl w-full grid grid-cols-[2fr_1fr] gap-12 items-center">
            <div className="flex justify-center">
              <VideoLoop
                src="/car-swerve.webm"
                className="w-full max-w-[780px] h-auto"
                rounded="rounded-3xl"
                contain
              />
            </div>

            <div>
              <h2 className="text-[40px] font-extrabold tracking-[-0.02em] leading-tight text-white">
                Every journey is different
              </h2>

              <p className="mt-6 text-[22px] font-extrabold tracking-normal text-white">
                we’re here to make yours
                <br />
                easier to navigate.
              </p>

              <p className="mt-6 text-sm leading-relaxed text-white/80 max-w-[46ch]">
                At <span className="font-semibold">WandR</span>, we turn structure
                into an art form, giving you the space to focus on what you do
                best while we take care of the rest.
              </p>
            </div>
          </div>
        </section>

        {/* 4 — SERVICES (admin + timeline) */}
        <section
          data-snap
          className="md:min-h-[850px] lg:min-h-[900px] px-6 flex items-center"
        >
          <div className="mx-auto max-w-6xl w-full">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-16 items-center">
              <div className="flex flex-col items-center text-center">
                <VideoLoop
                  src="/admin.webm"
                  className="w-[380px] h-auto mb-6"
                  rounded="rounded-none"
                  contain
                />
                <h3 className="text-[34px] font-extrabold tracking-tight mb-3">
                  Virtual <span className="text-wandr-rose">Assistance</span>
                </h3>
                <p className="text-sm text-white/80 leading-relaxed max-w-[38ch]">
                  Inbox, admin, scheduling, documents, follow-ups — we handle
                  the busywork so you can stay in flow.
                </p>
              </div>

              <div className="h-[260px] w-px bg-white/30" />

              <div className="flex flex-col items-center text-center">
                <VideoLoop
                  src="/timeline.webm"
                  className="w-[420px] h-auto mb-6"
                  rounded="rounded-none"
                  contain
                />
                <h3 className="text-[34px] font-extrabold tracking-tight mb-3">
                  Project <span className="text-wandr-rose">Management</span>
                </h3>
                <p className="text-sm text-white/80 leading-relaxed max-w-[38ch]">
                  Timelines, coordination, client comms, deliverables — we keep
                  projects organised and moving forward.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5 — EXPERIENCE (car-swerve.webm) */}
        <section
          data-snap
  className="md:min-h-[850px] lg:min-h-[900px] px-6 flex items-center bg-[color:var(--wandr-joyce)]"
>
          <div className="mx-auto max-w-6xl w-full flex flex-col justify-center gap-10">
            {/* top: text (slightly higher to balance gaps) */}
            <div className="grid gap-10 grid-cols-[.6fr_1.4fr] items-center -translate-y-[70px]">
              <div className="flex flex-col items-end text-right">
                <div className="text-[58px] font-black leading-none tracking-tight">
                  15+
                </div>
                <div className="mt-2 text-[58px] font-semibold text-white/90">
                  Years
                </div>
              </div>

              <p className="text-[16px] leading-[2.05] text-white/85 max-w-[62ch]">
                After more than{" "}
                <span className="font-semibold text-white">15 years</span>{" "}
                working for{" "}
                <span className="font-semibold text-white">FMCG</span> and{" "}
                <span className="font-semibold text-white">
                  creative advertising agencies
                </span>
                , we understand the rhythm of projects and what drives them
                forward: the long hours, shifting priorities, and constant
                movement between inspiration and delivery.
              </p>
            </div>

            {/* bottom: road bar + car */}
            <div className="relative h-[90px] w-full">
              <div className="absolute right-40 top-1/2 -translate-y-[50%]">
                <VideoLoop
                  src="/car-road.webm"
                  className="w-[850px] h-auto"
                  rounded="rounded-xl"
                  contain
                />
              </div>
            </div>
          </div>
        </section>

        {/* 6 — PATH (parrot-car.webm) */}
        <section
          data-snap
          className="md:min-h-[850px] lg:min-h-[900px] bg-[color:var(--wandr-rose)] px-6 flex items-center"
        >
          <div className="mx-auto max-w-6xl w-full flex flex-col items-center text-center gap-12">
            <h2 className="font-extrabold tracking-normal leading-[1.05] text-[34px] text-center mx-auto text-[color:var(--wandr-joyce)]">
              <span className="whitespace-nowrap">
                Every path is unique — unpredictable
              </span>
              <br />
              <span className="whitespace-nowrap">and always evolving</span>
            </h2>

            <div className="w-full flex items-center justify-center">
              <VideoLoop
                src="/flying-car.webm"
                className="w-[720px] h-[360px]"
                rounded="rounded-3xl"
                contain
              />
            </div>

            <p className="font-extrabold tracking-normal leading-[1.15] text-[34px] max-w-[36ch] text-[color:var(--wandr-joyce)]">
              Our role is to help you find clarity in the clutter and to bring
              structure to wherever your creativity wanders.
            </p>
          </div>
        </section>

        {/* 7 — CONTACT */}
        <section
          data-snap
          className="md:min-h-[850px] lg:min-h-[900px] px-6 flex items-center"
        >
          <div className="mx-auto max-w-6xl w-full flex flex-col items-center text-center gap-6">
            <p className="max-w-[52ch] text-xs text-white/75">
              If you’re ready to simplify your workload and protect your focus,
              reach out and let’s build a system that supports you.
            </p>

            <a
              href="mailto:hello@wandr.com"
              className="w-full max-w-[360px] bg-white text-black font-extrabold tracking-wide py-4 rounded-xl"
            >
              CONTACT US
            </a>

            <Image
          src="/wandr-logo-light-1.svg"
          alt="WandR"
          width={320}
          height={110}
          priority
          className="h-auto w-[350px]"
        />
          </div>

      
        </section>
      </div>
    </main>
  );
}
