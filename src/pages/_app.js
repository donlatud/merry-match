import "@/styles/globals.css";
import { Nunito, Prompt } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["500"],
  variable: "--font-prompt",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <main className={`${nunito.variable} ${prompt.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}
