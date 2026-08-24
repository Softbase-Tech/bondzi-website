import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { VercelAnalytics } from "@/components/analytics/VercelAnalytics";
import { Providers } from "./providers";

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
  "Bondzi is the AI-powered WAEC, WASSCE and BECE exam prep app for Ghanaian students — school candidates and Nov/Dec private candidates. Nine years of past questions across Core Mathematics, English, Integrated Science, Elective Maths, Physics, Chemistry, Biology, Economics and more. AI explanations for every wrong answer, spaced-repetition review, and full offline support. Free to download, paid in cedis.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: [
    "WAEC",
    "WAEC Ghana",
    "WAEC results checker",
    "WASSCE",
    "WASSCE 2026",
    "WASSCE timetable",
    "WASSCE Nov Dec",
    "WASSCE November December",
    "Nov Dec private candidate",
    "BECE",
    "BECE 2026",
    "BECE timetable",
    "WASSCE past questions",
    "BECE past questions",
    "WASSCE prep app",
    "BECE prep app",
    "Ghana exam app",
    "exam prep Ghana",
    "SHS revision Ghana",
    "JHS revision Ghana",
    "AI tutor Ghana",
    "Core Mathematics WASSCE",
    "Elective Mathematics WASSCE",
    "WASSCE English Language",
    "Integrated Science WASSCE",
    "WASSCE Physics",
    "WASSCE Chemistry",
    "WASSCE Biology",
    "WASSCE Economics",
    "WASSCE Geography",
    "WASSCE Government",
    "WASSCE History",
    "WASSCE Literature in English",
    "BECE Mathematics",
    "BECE English",
    "BECE Social Studies",
    "BECE Integrated Science",
    "spaced repetition exam prep",
    "WASSCE syllabus",
    "BECE syllabus",
    "Bondzi",
    "Bondzi app",
  ],
  authors: [{ name: "Cliffbase Tech", url: SITE_URL }],
  creator: "Cliffbase Tech",
  publisher: "Cliffbase Tech",
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
  founder: { "@type": "Organization", name: "Cliffbase Tech" },
  parentOrganization: { "@type": "Organization", name: "Cliffbase Tech" },
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
  publisher: { "@type": "Organization", name: "Cliffbase Tech" },
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
  publisher: { "@type": "Organization", name: "Cliffbase Tech" },
  downloadUrl: "https://expo.dev/artifacts/eas/oA5ZFub4WNxKkYEg5Wn2yn.apk",
  installUrl: "https://expo.dev/artifacts/eas/oA5ZFub4WNxKkYEg5Wn2yn.apk",
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
    >
      <head>
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
        <Providers>{children}</Providers>
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
      </body>
    </html>
  );
}
