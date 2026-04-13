import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "KalanConnect — Trouvez le meilleur professeur au Mali",
  description:
    "Plateforme malienne de cours particuliers. Trouvez des professeurs qualifies pres de chez vous a Bamako. Maths, Francais, Physique et plus.",
  keywords: [
    "cours particuliers Mali",
    "professeur Bamako",
    "soutien scolaire Mali",
    "KalanConnect",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          <Navbar />
          <main className="min-h-screen pb-20 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
