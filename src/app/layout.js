import "./globals.css";
import { Heebo } from "next/font/google";

const heebo = Heebo({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata = {
  title: "WandR | Administrative Support Services Netherlands",
  description:
    "Professional administrative support and business management services based in the Netherlands.",
  metadataBase: new URL("https://www.wilfredandr.com"),
  alternates: {
    canonical: "/",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${heebo.className} js`}>
        {children}
      </body>
    </html>
  );
}

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "WandR",
      url: "https://www.wilfredandr.com",
    }),
  }}
/>