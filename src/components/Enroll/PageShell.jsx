import Navbar from "../navbar";
import Footer from "../home/Footer";
import { useLanguage } from "../../context/LanguageContext";
import logo from "../../assets/num3.png";

// Navbar + page + Footer, so every page shares the same frame as the home page.
// `links` are the footer links: [{ to, label }]
export default function PageShell({ links = [], children }) {
  const { dir } = useLanguage();
  return (
    <div dir={dir} className="min-h-screen bg-ivory font-body">
      <Navbar />
      {children}
      <Footer
        logo={logo}
        name="Numeria Academy"
        rights={`© ${new Date().getFullYear()} Numeria Academy`}
        links={links}
      />
    </div>
  );
}