import { Inter, Jost, Electrolize, Lalezar } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost" });
const electrolize = Electrolize({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-electrolize",
});
const lalezar = Lalezar({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lalezar",
});

export const metadata = {
  title: "Racoode | Sociedad de Alumnos IDS",
  description: "Sociedad de estudiantes de Ingeniería en Desarrollo de Software",
};

export default function FrontendLayout({ children }) {
  return (
    <div
      className={`${inter.variable} ${jost.variable} ${electrolize.variable} ${lalezar.variable} font-sans bg-[#010736] text-[#FFFAEA] min-h-screen flex flex-col`}
    >
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}