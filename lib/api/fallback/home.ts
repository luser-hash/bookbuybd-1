import type { BookListItem } from '@/lib/api/contracts/books';
import type { GenreHighlight, HomeSummary } from '@/lib/api/contracts/home';
import { books, categories, heroSlides, printingServices, testimonials } from '@/lib/data';

function toBookListItem(book: (typeof books)[number]): BookListItem {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    coverImage: book.image,
    price: book.price,
    currency: 'BDT',
    rating: book.rating,
    genre: book.category,
    badges: book.bestseller ? ['TOP PICK'] : undefined,
  };
}

function buildGenreHighlights(): GenreHighlight[] {
  return categories
    .slice(0, 4)
    .map((category) => ({
      genre: category.name,
      books: books
        .filter((book) => book.category === category.name)
        .slice(0, 4)
        .map(toBookListItem),
    }))
    .filter((item) => item.books.length > 0);
}

export function buildHomeSummaryFallback(): HomeSummary {
  const bestsellers = books.filter((book) => book.bestseller).slice(0, 6).map(toBookListItem);
  const comingSoon = books
    .filter((book) => book.limitedOffer?.endDate)
    .slice(0, 4)
    .map((book) => ({
      ...toBookListItem(book),
      expectedDate: book.limitedOffer?.endDate.toISOString(),
    }));

  return {
    heroSlides: heroSlides.map((slide) => ({
      id: slide.id,
      tag: 'FEATURED',
      title: slide.title,
      ctaLabel: 'Shop Now',
      ctaHref: '/shop',
      imageUrl: slide.image,
    })),
    trendingSearches: ['Children', 'Audiobooks', 'Romance', 'Academic', 'Fiction'],
    featuredCategories: categories.slice(0, 3).map((category) => ({
      id: category.id,
      title: category.name,
      subtitle: `${category.count} books available`,
      imageUrl: '/images/books/book1.jpg',
    })),
    bestsellers,
    comingSoon,
    genreHighlights: buildGenreHighlights(),
    testimonials: testimonials.map((item) => ({
      id: item.id,
      name: item.name,
      role: item.location,
      text: item.comment,
      stars: item.rating,
    })),
    printingCategories: printingServices.map((service) => ({
      id: service.id,
      label: service.title,
      icon: service.icon,
      items: [
        {
          id: `${service.id}-1`,
          name: service.title,
          description: service.description,
          icon: service.icon,
        },
      ],
    })),
    contactInfo: {
      phone: '+880 1712-345678',
      email: 'info@bookbuybd.com',
      address: 'Nilkhet, Dhaka-1205',
    },
    updatedAt: new Date().toISOString(),
  };
}

