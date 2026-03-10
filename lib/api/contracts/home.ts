import type { BookListItem } from '@/lib/api/contracts/books';
import type { PrintingCategory } from '@/lib/api/contracts/printing';

export interface HeroSlide {
  id: string;
  tag: string;
  title: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  backgroundFrom?: string;
  backgroundTo?: string;
}

export interface HomeCategoryCard {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  text: string;
  imageUrl?: string;
  stars: number;
}

export interface GenreHighlight {
  genre: string;
  books: BookListItem[];
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
}

export interface HomeSummary {
  heroSlides: HeroSlide[];
  trendingSearches: string[];
  featuredCategories: HomeCategoryCard[];
  bestsellers: BookListItem[];
  comingSoon: BookListItem[];
  genreHighlights: GenreHighlight[];
  testimonials: Testimonial[];
  printingCategories: PrintingCategory[];
  contactInfo?: ContactInfo;
  updatedAt: string;
}

