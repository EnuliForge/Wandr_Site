import Image from "next/image";

export default function ThankYou() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-wandr-joyce text-white px-6">
      <div className="text-center max-w-md space-y-6">

        {/* Logo */}
        <div className="flex justify-center mb-2">
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

        <h1 className="text-4xl font-semibold text-wandr-rose">
          Message Sent!
        </h1>

        <p className="text-white/80 text-lg leading-relaxed">
          Thanks for reaching out to WandR. We’ll get back to you shortly.
        </p>

        <div className="pt-4">
          <a
            href="/"
            className="inline-block px-6 py-3 text-sm font-medium rounded-full bg-white text-wandr-joyce hover:bg-wandr-wilfred transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    </main>
  );
}
