import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { VercelAnalytics } from "@/components/analytics/VercelAnalytics";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { themeScript } from "@/components/theme/theme-script";

// Google Analytics 4 measurement ID. Public by design (it ends up in
// the rendered HTML) so committing the literal is safe. Swap for
// `process.env.NEXT_PUBLIC_GA_ID` if you ever need separate dev /
// staging / prod properties.
const GA_ID = "G-X3SMDYPJ2M";
// Gate analytics to production so local `next dev` traffic doesn't
// pollute the report. Flip the env or remove this guard if you need
// to debug the integration against the real property.
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const SITE_URL = "https://bondzi.online";
const SITE_NAME = "Bondzi";
const TAGLINE = "WASSCE & BECE exam prep, made in Ghana";
const DESCRIPTION =
  "Bondzi is the AI-powered WAEC, WASSCE and BECE exam prep app for Ghanaian students — school candidates and Nov/Dec private candidates. Thirty-four years of past questions across Core Mathematics, English, Integrated Science, Elective Maths, Physics, Chemistry, Biology, Economics and more. AI explanations for every wrong answer, spaced-repetition review, and full offline support. Free to download, paid in cedis.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  authors: [{ name: "Cliffbase Technologies", url: SITE_URL }],
  creator: "Cliffbase Technologies",
  publisher: "Cliffbase Technologies",
  category: "education",
  alternates: {
    canonical: "/",
    languages: {
      "en-GH": "/",
      "en-US": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    alternateLocale: ["en_US", "en_GB"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
    creator: "@bondziapp",
    site: "@bondziapp",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    shortcut: "/icon.png",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  verification: {
    // Just the token — Next prepends `<meta name="google-site-verification" content="...">`,
    // so the leading `google-site-verification=` from GSC's snippet must be stripped.
    google: "xld6k7dE8uNxro4HlGJm2OxDGJeBds9Kuld-VK0ndWE",
    // other: { "msvalidate.01": "..." },
  },
  other: {
    "geo.region": "GH",
    "geo.placename": "Accra",
    "DC.language": "en-GH",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7ec" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE_NAME,
  alternateName: "Bondzi App",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/icon.png`,
  description: DESCRIPTION,
  email: "support@bondzi.online",
  foundingDate: "2026",
  founder: { "@type": "Organization", name: "Cliffbase Technologies" },
  parentOrganization: { "@type": "Organization", name: "Cliffbase Technologies" },
  areaServed: {
    "@type": "Country",
    name: "Ghana",
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "GH",
    addressLocality: "Accra",
  },
  sameAs: ["https://bondzi.online"],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: "en-GH",
  publisher: { "@type": "Organization", name: "Cliffbase Technologies" },
};

const mobileAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  name: SITE_NAME,
  operatingSystem: "ANDROID",
  applicationCategory: "EducationalApplication",
  applicationSubCategory: "Exam preparation",
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "Senior High School and Junior High School students in Ghana",
  },
  description: DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/brand/icon.png`,
  inLanguage: "en-GH",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GHS",
    availability: "https://schema.org/InStock",
    eligibleRegion: { "@type": "Country", name: "Ghana" },
  },
  publisher: { "@type": "Organization", name: "Cliffbase Technologies" },
  // `downloadUrl` / `installUrl` intentionally omitted until the Play
  // Store listing is live. They previously pointed at a direct APK,
  // which is unattributable (no Play Install Referrer) — and publishing
  // a sideload link as structured data invites search engines to
  // surface it as the canonical install route. Restore both, pointing
  // at the Play listing, when NEXT_PUBLIC_PLAY_STORE_URL is set.
  about: [
    "WASSCE",
    "BECE",
    "Past Questions",
    "Spaced Repetition",
    "AI Tutoring",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GH"
      // The blocking theme script below sets `class="dark"` and
      // `style.colorScheme` on this element before React hydrates, so the
      // server markup and the first client render legitimately differ.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
    >
      <head>
        {/* Must run before first paint: a dark-mode student would
            otherwise get a full-brightness white flash on every load.
            Also decides whether this surface gets dark mode at all —
            the marketing site is light-only. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:text-bg focus:px-3 focus:py-2 focus:rounded-md focus:text-sm"
        >
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(mobileAppJsonLd) }}
        />
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
        {/* Google Analytics 4 (gtag.js). next/script's
            `afterInteractive` strategy is the App Router equivalent of
            the `async` attribute on the original snippet — the loader
            script runs after the initial page becomes interactive so
            it never blocks first paint. The second Script element
            holds the init code; giving it an `id` lets Next.js skip
            re-injection on client navigation. Production-only so we
            don't pollute the GA report with `npm run dev` pageviews. */}
        {IS_PRODUCTION && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        <VercelAnalytics />
        {/* Reads utm_* / ?ref= off the URL into a `.bondzi.online`
            cookie so the campaign survives the hop to app.bondzi.online,
            where registration actually happens. Suspense-wrapped because
            it calls useSearchParams, which would otherwise opt the whole
            tree out of static rendering. */}
        <Suspense fallback={null}>
          <AttributionCapture />
        </Suspense>
      </body>
    </html>
  );
}
