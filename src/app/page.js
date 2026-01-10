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

  const commonClass = `${className} ${rounded} ${
    contain ? "object-contain" : "object-cover"
  } block`;

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
    <div className={`absolute ${pos} text-white/35 font-extrabold text-2xl select-none`}>
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

  useLayoutEffect(() => {
    measure();
    const t = setTimeout(measure, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsKey, className]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

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

  const [contactStatus, setContactStatus] = useState({ state: "idle", message: "" });

  async function onSubmit(e) {
  e.preventDefault();
  setContactStatus({ state: "sending", message: "" });

  const form = e.currentTarget;

  // Honeypot (Formspree)
  if (form._gotcha?.value) return;

  const formData = new FormData(form);

  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    company: String(formData.get("company") || "").trim(),
    message: String(formData.get("message") || "").trim(),
  };

  if (!payload.name || !payload.email || !payload.message) {
    setContactStatus({
      state: "error",
      message: "Please fill in name, email, and message.",
    });
    return;
  }

  try {
    const res = await fetch("https://formspree.io/f/xlggrlwq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.errors?.[0]?.message || "Failed to send.");
    }

    form.reset();
    setContactStatus({
      state: "success",
      message: "Message sent. We’ll get back to you shortly.",
    });
  } catch (err) {
    setContactStatus({
      state: "error",
      message: err?.message || "Failed to send. Please try again.",
    });
  }
}

  return (
    <main className="min-h-screen bg-[color:var(--wandr-wilfred)] text-white overflow-hidden md:overflow-visible">

      {/* =========================
          MOBILE (no snapping, NO gradient)
          ========================= */}
      <div
        ref={mobileRef}
        className="md:hidden overflow-y-auto [-webkit-overflow-scrolling:touch]"
      >
        {/* 1 — HERO */}
        <section className="bg-[color:var(--wandr-wilfred)] px-6 py-48">
          <div
            data-cascade
            style={{
              "--cascade-y": "12px",
              "--cascade-dur": "850ms",
              "--cascade-stagger": "220ms",
            }}
            className="mx-auto max-w-[560px] flex flex-col items-center text-center gap-8"
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
        <section className="bg-[color:var(--wandr-joyce)] px-6 py-12">
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
                src="/car-swerve-3.webm"
  className="w-full max-w-[250px] h-auto" rounded=""
                contain
              />
            </div>

            <p
              data-cascade-item
              className="text-[22px] leading-snug font-extrabold tracking-tight max-w-[36ch]"
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

       {/* CONTACT */}
<section id="contact" className="bg-[#16908c]">
  <div className="mx-auto max-w-6xl w-full px-6 lg:px-20 py-12 md:py-16">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">

      {/* LEFT — COPY */}
      <div className="text-center md:text-left">
        <div className="text-wandr-joyce font-extrabold tracking-tight text-[30px] md:text-[42px] leading-[1.05]">
          Let’s Work Together
        </div>

        <p className="mt-4 md:mt-5 text-[#163f3f]/80 leading-relaxed max-w-[52ch] text-[15px] md:text-[16px]">
          If you're ready to simplify your workload and refocus on what you love creating,{" "}
          <span className="font-semibold text-wandr-joyce">WandR</span> can help you find your rhythm
          and direction again.
        </p>

        <div className="mt-6 md:mt-8 space-y-2 md:space-y-3 text-[13px] md:text-sm text-[#163f3f]/80">
          <div>
            <span className="font-semibold text-[#163f3f]">Typical response:</span>{" "}
            within 1–2 business days
          </div>
          <div>
            <span className="font-semibold text-[#163f3f]">Include:</span>{" "}
            timeline, scope, and any links/assets
          </div>
        </div>
      </div>

      {/* RIGHT — FORM */}
      <div className="bg-white/70 rounded-3xl p-5 sm:p-6 md:p-6 shadow-sm border border-black/5 w-full md:max-w-[520px] md:ml-auto">
        <form
          onSubmit={onSubmit}
          action="https://formspree.io/f/xlggrlwq"
          method="POST"
          className="space-y-4"
        >
          {/* Formspree helpers */}
          <input type="hidden" name="_subject" value="New WandR enquiry" />
          <input
            type="text"
            name="_gotcha"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Name + Email: stack on mobile, 2-col on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#163f3f]">Name *</span>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                className="mt-2 w-full rounded-2xl px-4 py-3 bg-white text-[#163f3f] placeholder:text-[#163f3f]/50 caret-[#163f3f] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Your name"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#163f3f]">Email *</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-2xl px-4 py-3 bg-white text-[#163f3f] placeholder:text-[#163f3f]/50 caret-[#163f3f] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="you@email.com"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-[#163f3f]">Company (optional)</span>
            <input
              name="company"
              type="text"
              autoComplete="organization"
              className="mt-2 w-full rounded-2xl px-4 py-3 bg-white text-[#163f3f] placeholder:text-[#163f3f]/50 caret-[#163f3f] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Studio / Brand / Team"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#163f3f]">Message *</span>
            <textarea
              name="message"
              required
              rows={5}
              className="mt-2 w-full rounded-2xl px-4 py-3 bg-white text-[#163f3f] placeholder:text-[#163f3f]/50 caret-[#163f3f] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
              placeholder="What do you need help with? Any deadlines or links?"
            />
          </label>

          {/* Button + status: stack on mobile */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={contactStatus.state === "sending"}
              className="rounded-2xl px-5 py-3 font-semibold bg-[#163f3f] text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {contactStatus.state === "sending" ? "Sending..." : "Send message"}
            </button>

            <div
              className={`text-sm sm:text-right ${
                contactStatus.state === "success"
                  ? "text-emerald-700"
                  : contactStatus.state === "error"
                  ? "text-red-600"
                  : "text-transparent"
              }`}
            >
              {contactStatus.message || ""}
            </div>
          </div>

          <p className="text-[11px] text-[#163f3f]/55 leading-relaxed pt-2">
            By sending this form, you agree to be contacted about your request. No spam.
          </p>
        </form>
      </div>

    </div>
  </div>
</section>


{/* MOBILE FOOTER */}
<div className="flex flex-col items-center gap-2 text-[11px] leading-none bg-wandr-joyce pt-2 pb-2 text-white/60 sm:hidden">

  {/* Legal info */}
  <div className="flex items-center gap-3 whitespace-nowrap">
    <span>
      KVK <span className="text-white/80 font-normal">97180467</span>
    </span>
    <span className="text-white/25">•</span>
    <span>
      BTW <span className="text-white/80 font-normal">NL005254792B71</span>
    </span>
  </div>

  {/* Brand */}
  <div className="font-medium tracking-tight text-white/75 whitespace-nowrap">
    Wilfred &amp; Rose
  </div>

</div>




        {/* ===== END MOBILE ===== */}
      </div>{/* ✅ CLOSE MOBILE WRAPPER */}


      {/* =========================
          DESKTOP (custom snapping)
          ========================= */}
      <div ref={desktopRef} className="hidden md:block h-screen overflow-y-auto">
        {/* 1 — HERO */}
<section
  data-snap
  className="min-h-[100svh] max-[1440px]:min-h-[720px] grid bg-[color:var(--wandr-wilfred)] place-items-center py-14 sm:py-16 lg:py-20"
>
  <div className="mx-auto max-w-5xl w-full px-10 lg:px-20 py-12 flex flex-col items-center text-center gap-8 max-[1440px]:gap-7">
    <Image
      src="/wandr-logo-light-1.svg"
      alt="WandR"
      width={640}
      height={220}
      priority
      className="h-auto w-[520px] max-w-full max-[1440px]:w-[460px]"
    />

    <h1 className="text-center text-[46px] max-[1440px]:text-[40px] leading-[1.08] font-extrabold tracking-tight text-white">
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


       {/* 2+3 — ADMIN + JOURNEY (COMBINED 2x2, FULL-BLEED ROW BACKGROUNDS) */}
<section data-snap className="min-h-[100svh]">
  {/* Row 1 (Wilfred) — FULL BLEED BG */}
  <div className="bg-[color:var(--wandr-wilfred)] w-full">
    {/* inner content controls width + shift */}
    <div
  className="
    mx-auto max-w-6xl w-full
    px-6 lg:px-20
    py-10 max-[1440px]:py-8
    translate-x-4 lg:translate-x-10
  "
>

      <div className="grid grid-cols-2 items-center gap-12 max-[1440px]:gap-8">
        <div className="flex items-center justify-center pl-8">
          <VideoLoop
            src="/mail.webm"
            className="w-full max-w-[520px] max-[1440px]:max-w-[440px] h-auto"
            rounded="rounded-3xl"
            contain
          />
        </div>

        <div className="flex items-center justify-start">
          <div className="max-w-[36ch] text-left">
            <h2 className="text-[34px] max-[1440px]:text-[28px] leading-tight font-extrabold tracking-normal text-white">
              No one starts a business dreaming of admin
              <br />
              <span className="text-wandr-rose">— except us.</span>
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

  {/* Row 2 (Dark teal) — FULL BLEED BG */}
  <div className="bg-[#163f3f] w-full">
    {/* inner content controls width + shift */}
    <div
  className="
    mx-auto max-w-6xl w-full
    px-6 lg:px-20
    py-6 sm:py-8 lg:py-10
    translate-x-4 lg:translate-x-10
  "
>

      <div className="grid grid-cols-2 items-center gap-12 max-[1440px]:gap-8">
        <div className="flex items-center justify-center text-right">
          <div className="max-w-[30ch]">
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

        <div className="flex items-center justify-start">
          <VideoLoop
            src="/car-swerve-3.webm"
            className="w-full max-w-[350px] max-[1440px]:max-w-[300px] h-auto"
            rounded=""
            contain
          />
        </div>
      </div>
    </div>
  </div>
</section>



        {/* 4+5 — SERVICES + EXPERIENCE (COMBINED 2x2, FULL-BLEED ROW BACKGROUNDS) */}
<section
  data-snap
  className="min-h-[100svh] max-[1440px]:min-h-[720px]"
>
  {/* Row 1 (Wilfred) */}
  <div className="bg-[color:var(--wandr-wilfred)] w-full">
    <div className="flex items-start">
      <div
        className="
          mx-auto max-w-6xl w-full
          px-6 lg:px-20
          py-6 sm:py-8 lg:py-10
          translate-x-4 lg:translate-x-10
        "
      >
        <div className="grid grid-cols-2 items-center gap-12 max-[1440px]:gap-8">
          {/* Left — Virtual Assistance */}
          <div className="flex items-center justify-center text-right">
            <div className="max-w-[36ch]">
              <VideoLoop
                src="/admin.webm"
                className="w-[380px] max-[1440px]:w-[280px] h-auto mx-auto mb-6 max-[1440px]:mb-4"
                rounded="rounded-none"
                contain
              />

              <div className="-mt-[6px] max-[1440px]:-mt-[4px]">
                <h3 className="text-[40px] max-[1440px]:text-[28px] font-extrabold tracking-tight mb-3 max-[1440px]:mb-2 text-white">
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
          <div className="flex items-center justify-start text-left">
            <div className="max-w-[38ch] relative max-[1440px]:-left-[6px]">
              <VideoLoop
                src="/timeline-3.webm"
                className="w-[350px] max-[1440px]:w-[280px] h-auto mx-auto mb-6 max-[1440px]:mb-4"
                rounded="rounded-none"
                contain
              />

              <div className="-mt-[6px] max-[1440px]:-mt-[4px]">
                <h3 className="text-[40px] max-[1440px]:text-[28px] font-extrabold tracking-tight mb-3 max-[1440px]:mb-2 text-white">
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
  <div className="bg-[#163f3f] w-full overflow-hidden">
    <div
      className="
        mx-auto max-w-6xl w-full
        px-6 lg:px-20
        py-12 sm:py-14 lg:py-16
        translate-x-4 lg:translate-x-10
      "
    >
      <div className="grid grid-cols-2 items-center gap-0">
        {/* Left */}
        <div className="flex items-center justify-center text-right pr-16 max-[1440px]:pr-8">
          <div className="max-w-[36ch]">
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
        <div className="flex items-start justify-start pr-10 max-[1440px]:pl-2 mb-6">
          <div className="w-full max-w-[850px] max-[1440px]:max-w-[480px] h-[280px] max-[1440px]:h-[220px] overflow-hidden">
            <VideoLoop
              src="/car-road-2.webm"
              className="w-[350px] h-full"
              rounded="rounded-xl"
              contain
            />
          </div>
        </div>
      </div>
    </div>
  </div>
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

{/* CONTACT — DESKTOP */}
<section id="contact" className="bg-[#16908c] hidden md:block">
  <div className="mx-auto max-w-6xl w-full px-6 lg:px-20 py-16">
    <div className="grid grid-cols-2 gap-10 items-start">

      {/* LEFT — COPY */}
      <div>
        <div className="text-wandr-joyce font-extrabold tracking-tight text-[42px] leading-[1.05]">
          Let’s Work Together
        </div>

        <p className="mt-5 text-[#163f3f]/80 leading-relaxed max-w-[52ch] text-[16px]">
          If you're ready to simplify your workload and refocus on what you love creating,{" "}
          <span className="font-semibold text-wandr-joyce">WandR</span> can help you find your rhythm
          and direction again.
        </p>

        <div className="mt-8 space-y-3 text-sm text-[#163f3f]/80">
          <div>
            <span className="font-semibold text-[#163f3f]">Typical response:</span>{" "}
            within 1–2 business days
          </div>
          <div>
            <span className="font-semibold text-[#163f3f]">Include:</span>{" "}
            timeline, scope, and any links/assets
          </div>
        </div>
      </div>

      {/* RIGHT — FORM */}
      <div className="bg-white/70 rounded-3xl p-6 shadow-sm border border-black/5 max-w-[520px] ml-auto">
        <form
          onSubmit={onSubmit}
          action="https://formspree.io/f/xlggrlwq"
          method="POST"
          className="space-y-4"
        >
          {/* Formspree helpers */}
          <input type="hidden" name="_subject" value="New WandR enquiry" />
          <input
            type="text"
            name="_gotcha"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#163f3f]">Name *</span>
              <input
                name="name"
                type="text"
                required
                autoComplete="name"
                className="mt-2 w-full rounded-2xl px-4 py-3 bg-white text-[#163f3f] placeholder:text-[#163f3f]/50 caret-[#163f3f] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Your name"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#163f3f]">Email *</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-2xl px-4 py-3 bg-white text-[#163f3f] placeholder:text-[#163f3f]/50 caret-[#163f3f] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="you@email.com"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-[#163f3f]">Company (optional)</span>
            <input
              name="company"
              type="text"
              autoComplete="organization"
              className="mt-2 w-full rounded-2xl px-4 py-3 bg-white text-[#163f3f] placeholder:text-[#163f3f]/50 caret-[#163f3f] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Studio / Brand / Team"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#163f3f]">Message *</span>
            <textarea
              name="message"
              required
              rows={5}
              className="mt-2 w-full rounded-2xl px-4 py-3 bg-white text-[#163f3f] placeholder:text-[#163f3f]/50 caret-[#163f3f] border border-black/10 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
              placeholder="What do you need help with? Any deadlines or links?"
            />
          </label>

          <div className="pt-2 flex items-center justify-between gap-4">
            <button
              type="submit"
              disabled={contactStatus.state === "sending"}
              className="rounded-2xl px-5 py-3 font-semibold bg-[#163f3f] text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {contactStatus.state === "sending" ? "Sending..." : "Send message"}
            </button>

            <div
              className={`text-sm md:text-right ${
                contactStatus.state === "success"
                  ? "text-emerald-700"
                  : contactStatus.state === "error"
                  ? "text-red-600"
                  : "text-transparent"
              }`}
            >
              {contactStatus.message || ""}
            </div>
          </div>

          <p className="text-[11px] text-[#163f3f]/55 leading-relaxed pt-2">
            By sending this form, you agree to be contacted about your request. No spam.
          </p>
        </form>
      </div>

    </div>
  </div>
</section>



      <footer className="bg-[#163f3f]">
        <div className="mx-auto max-w-6xl w-full px-6 lg:px-20 py-2">
          {/* MOBILE: stacked */}
          <div className="flex flex-col items-center gap-1 text-[11px] leading-none text-white/60 sm:hidden">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <span>
                KVK <span className="text-white/80 font-normal">97180467</span>
              </span>
              <span className="text-white/25">•</span>
              <span>
                BTW <span className="text-white/80 font-normal">NL005254792B71</span>
              </span>
            </div>
            <div className="font-medium tracking-tight text-white/75 whitespace-nowrap">
              Wilfred &amp; Rose
            </div>
          </div>

          {/* DESKTOP+: single-line with centered legal + brand right */}
          <div className="relative hidden sm:flex items-center text-[11px] leading-none text-white/60">
            {/* Centered legal info */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 whitespace-nowrap">
              <span>
                KVK <span className="text-white/80 font-normal">97180467</span>
              </span>
              <span className="text-white/25">•</span>
              <span>
                BTW <span className="text-white/80 font-normal">NL005254792B71</span>
              </span>
            </div>

            {/* Right-aligned brand */}
            <div className="ml-auto font-medium tracking-tight text-white/75 whitespace-nowrap">
              Wilfred &amp; Rose
            </div>
          </div>
        </div>
      </footer>

</div>
    </main>
  );
}
