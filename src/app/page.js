"use client";

import Image from "next/image";
import { FileText, CalendarCheck, Folders } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-wandr-joyce">
      {/* Header */}
      <header className="w-full border-b border-wandr-joyce/10 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-28">
              <Image
                src="/wandr/wandr-logo-dg.svg" // change if needed
                alt="WandR logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="hidden sm:inline text-[0.65rem] tracking-[0.35em] uppercase text-wandr-joyce/70">
              Virtual assistant
            </span>
          </div>
          <a
            href="#contact"
            className="text-xs font-medium tracking-wide uppercase rounded-full border border-wandr-joyce/30 px-4 py-1.5 text-wandr-joyce hover:bg-wandr-joyce hover:text-wandr-rose transition-colors"
          >
            Let&apos;s talk
          </a>
        </div>
      </header>

      {/* Hero */}
<section
  className="relative min-h-[70vh] flex items-center justify-center px-6 py-20 bg-fixed bg-center bg-cover"
  style={{ backgroundImage: "url('/wandr/wandr-bg.webp')" }}
>
  {/* Blur layer */}
  <div className="absolute inset-0 backdrop-blur-sm"></div>

  {/* Overlay panel */}
  <div className="relative bg-wandr-joyce rounded-2xl p-10 text-center max-w-3xl text-white space-y-6">

    {/* Centered Logo */}
    <div className="flex justify-center">
      <div className="relative h-14 w-40">
        <Image
          src="/wandr/wandr-logo-light.svg"
          alt="WandR logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>

    <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
      Virtual Assistant &amp; Business Support{" "}
      <span className="text-wandr-rose">for Creative Professionals</span>
    </h1>

    <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto">
      No one starts a business dreaming of admin — except us. At WandR, we help
      creatives stay focused on their craft — not their inbox.
    </p>

    <div className="flex justify-center gap-3 pt-2">
      <a
        href="#services"
        className="px-5 py-2.5 text-sm rounded-full bg-white text-wandr-joyce hover:bg-wandr-rose hover:text-wandr-joyce transition-colors"
      >
        View services
      </a>
    </div>

  </div>
</section>

      {/* Services */}
      <section
        id="services"
        className="px-6 py-16 bg-wandr-wilfred/5 text-wandr-joyce"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">
            What we can do for you
          </h2>
          <p className="text-xs uppercase tracking-[0.25em] text-wandr-joyce/60 mb-6">
            Support that fits the way you work
          </p>
          <p className="text-wandr-joyce/80 mb-10 max-w-3xl">
            Every creative journey is different — we’re here to make yours
            easier to navigate. At WandR, we turn structure into an art form,
            giving you the space to focus on what you do best while we take care
            of the rest.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {/* 1 — Virtual Assistance */}
            <div className="border border-wandr-wilfred/30 rounded-2xl p-6 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-7 w-7 text-wandr-joyce" />
                <h3 className="font-semibold text-wandr-joyce">
                  Virtual Assistance for Creatives
                </h3>
              </div>
              <p className="text-sm text-wandr-joyce/80">
                Reliable, detail-driven support to keep your business running
                smoothly — from inbox and calendar management to client
                communication and document organization.
              </p>
            </div>

            {/* 2 — Project Support */}
            <div className="border border-wandr-wilfred/30 rounded-2xl p-6 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <CalendarCheck className="h-7 w-7 text-wandr-joyce" />
                <h3 className="font-semibold text-wandr-joyce">
                  Project &amp; Production Support
                </h3>
              </div>
              <p className="text-sm text-wandr-joyce/80">
                Stay on track from concept to completion. We manage scheduling,
                coordination, and communication so your ideas never get lost in
                logistics.
              </p>
            </div>

            {/* 3 — Business Organization */}
            <div className="border border-wandr-wilfred/30 rounded-2xl p-6 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Folders className="h-7 w-7 text-wandr-joyce" />
                <h3 className="font-semibold text-wandr-joyce">
                  Creative Business Organization
                </h3>
              </div>
              <p className="text-sm text-wandr-joyce/80">
                Bring clarity to creative chaos. From file systems and workflow
                design to research and project tracking, we help you build
                structure that supports your momentum.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why WandR */}
      <section className="px-6 py-16 bg-wandr-joyce text-white">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold">Why WandR</h2>
          <p className="text-white/90">
            Every creative path is unique — unpredictable, inspiring, and always
            evolving. After 15+ years working with creatives we understand the
            rhythm of creative industries: the long hours, shifting priorities,
            and constant movement between inspiration and delivery.
          </p>
          <p className="text-white/90">
            WandR combines practical virtual assistant services with a deep
            respect for creative flow, helping you reclaim your time, simplify
            your processes, and focus on your craft.
          </p>
        </div>
      </section>

      {/* Our Journey */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-wandr-joyce">
            Our Journey
          </h2>
          <p className="text-wandr-joyce/90">
            WandR began with a simple belief: creative professionals shouldn’t
            have to choose between artistic focus and business structure. We
            find joy in the details that others overlook — because we know that
            behind every great creative vision lies a foundation of calm,
            consistent support.
          </p>
        </div>
      </section>

      {/* Contact / Let’s Work Together */}
      <section
        id="contact"
        className="px-6 py-16 bg-wandr-rose text-wandr-joyce"
      >
        <div className="max-w-5xl mx-auto grid gap-10 md:grid-cols-2 items-start">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Let&apos;s work together
            </h2>
            <p className="text-xs uppercase tracking-[0.25em] text-wandr-joyce/70">
              You don&apos;t have to do it all alone
            </p>
            <p className="text-wandr-joyce/90">
              If you’re ready to simplify your workload and refocus on what you
              love creating, WandR can help you find your rhythm and direction
              again.
            </p>
             </div>

          <form
            className="space-y-4 bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg"
            onSubmit={async (e) => {
              e.preventDefault();

              const form = e.currentTarget;
              const data = new FormData(form);

              const res = await fetch("https://formspree.io/f/xkgkeogn", {
                method: "POST",
                body: data,
                headers: {
                  Accept: "application/json",
                },
              });

              if (res.ok) {
                form.reset();
                window.location.href = "/thank-you";
              } else {
                alert(
                  "Something went wrong. Please try again or email us directly."
                );
              }
            }}
          >
            <div>
              <label className="block text-sm mb-1 text-wandr-joyce">
                Name
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full border border-wandr-wilfred/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wandr-wilfred bg-white"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-wandr-joyce">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full border border-wandr-wilfred/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wandr-wilfred bg-white"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-wandr-joyce">
                How can we support you?
              </label>
              <textarea
                rows={4}
                name="message"
                required
                className="w-full border border-wandr-wilfred/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wandr-wilfred bg-white"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-full bg-wandr-joyce text-wandr-rose hover:bg-wandr-wilfred transition-colors"
            >
              Send message
            </button>
          </form>
        </div>
      
            </section> {/* Contact section ends here */}

      {/* Footer */}
      <footer className="w-full bg-white text-wandr-joyce/70 text-xs py-6 border-t border-wandr-joyce/10">
        <div className="max-w-5xl mx-auto text-center px-6">
          Wilfred &amp; Rose Trading • Goedewerf 83, 1357AR Almere, Netherlands • +31 64 454 7195‬
        </div>
      </footer>


    </main>
  );
}
