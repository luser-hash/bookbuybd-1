import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/sections/HeroCarousel';
import Categories from '@/components/sections/Categories';
import BooksGrid from '@/components/sections/BooksGrid';
import About from '@/components/sections/About';
import PrintingHub from '@/components/sections/PrintingHub';
import Testimonials from '@/components/sections/Testimonials';
import Contact from '@/components/sections/Contact';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroCarousel />
      <Categories />
      <BooksGrid />
      <About />
      <PrintingHub />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
}
