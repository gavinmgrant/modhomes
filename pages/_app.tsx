import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import localFont from "next/font/local";

// Served from the site with the page, rather than from Google's stylesheet,
// which held up the first paint. It's a file in the repo, not one
// next/font/google downloads, so a bad response from Google Fonts can't fail
// the build. styles/fonts/inter/README.md says how it was made. globals.css
// sets it on everything through this variable, on the root so MUI's portals
// pick it up too
const inter = localFont({
  src: "../styles/fonts/inter/Inter-latin.woff2",
  weight: "400 700",
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        :root {
          --font-inter: ${inter.style.fontFamily};
        }
      `}</style>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
