import { Plus_Jakarta_Sans, Cairo } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "../lib/i18n";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata = {
  title: "Eventzone - All-in-One Event Management Solution",
  description: "A premium event organizer platform to design floor layouts and manage schedules.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={`h-full antialiased ${plusJakartaSans.className} ${cairo.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem("app_language");
                if (saved && (saved === "ar" || saved === "fr" || saved === "en")) {
                  document.documentElement.lang = saved;
                  document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
                }
              } catch (e) {}
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Dancing+Script:wght@600;700&family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Great+Vibes&family=Inter:wght@400;500;600;700;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Marcellus&family=Marck+Script&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=Monsieur+La+Doulaise&family=Montserrat:ital,wght@0,400..900;1,400..900&family=Outfit:wght@400;500;600;700;800&family=Oswald:wght@400;600;700&family=Parisienne&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Poppins:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Prata&family=Raleway:ital,wght@0,400..800;1,400..800&family=Sacramento&family=Satisfy&family=Space+Grotesk:wght@400;600;700&family=Tangerine:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <LanguageProvider>
          {children}
        </LanguageProvider>

        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9CWJR76ZMX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-9CWJR76ZMX');
          `}
        </Script>
      </body>
    </html>
  );
}
