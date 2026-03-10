export const endpoints = {
  home: {
    summary: '/home',
    heroSlides: '/home/hero-slides',
    trendingSearches: '/search/trending',
    featuredCategories: '/categories',
    testimonials: '/testimonials',
    genreHighlights: '/home/genres/highlights',
  },
  books: {
    list: '/books/',
    categories: '/books/categories/',
    authorOfWeek: '/books/author-of-the-week/',
    booksOfYear: '/books/books-of-the-year/',
    bestSelling: '/books/best-selling/',
    detail: (bookId: string) => `/books/${bookId}`,
    likes: (bookId: string) => `/books/${bookId}/likes`,
  },
  printing: {
    categories: '/printing/categories/',
    categoryItems: (categoryId: string) => `/printing/categories/${categoryId}/items/`,
    requests: '/printing/requests/',
    requestDetail: (requestId: string) => `/printing/requests/${requestId}/`,
    estimate: '/printing/requests/estimate/',
    uploads: '/printing/uploads/presign/',
  },
  contact: {
    info: '/contact/info',
    subjects: '/contact/subjects',
    availability: '/contact/availability',
    messages: '/contact/messages',
    messageDetail: (messageId: string) => `/contact/messages/${messageId}`,
  },
  search: {
    suggestions: '/search/suggestions',
  },
  cart: {
    summary: '/cart/summary',
  },
} as const;
