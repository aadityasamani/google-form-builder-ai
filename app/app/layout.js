import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FormAI — AI Google Form Builder",
  description:
    "Generate real Google Forms instantly from a text prompt. Powered by Groq AI. Free to use.",
  keywords: "Google Forms, AI form builder, form generator, Groq AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
