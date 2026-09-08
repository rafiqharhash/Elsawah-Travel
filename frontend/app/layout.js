import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"]
});
export const metadata = {
  title: "Elsawah Travel | السواح",
  description: "Professional Transportation Services"
};
export default function RootLayout({
  children
}) {
  return /*#__PURE__*/_jsxDEV("html", {
    lang: "en",
    suppressHydrationWarning: true,
    children: [/*#__PURE__*/_jsxDEV("head", {
      children: /*#__PURE__*/_jsxDEV("script", {
        dangerouslySetInnerHTML: {
          __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                  var lang = localStorage.getItem('lang') || 'en';
                  document.documentElement.setAttribute('lang', lang);
                  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `
        }
      }, void 0, false)
    }, void 0, false), /*#__PURE__*/_jsxDEV("body", {
      className: `${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} antialiased`,
      children: /*#__PURE__*/_jsxDEV(Providers, {
        children: children
      }, void 0, false)
    }, void 0, false)]
  }, void 0, true);
}