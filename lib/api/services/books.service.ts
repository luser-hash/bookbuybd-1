import { apiClient } from '@/lib/api/client';
import type {
  BestSellingBook,
  BestSellingQuery,
  BookAuthor,
  BookDetailResponse,
  BookListItem,
  BookListQuery,
  PaginatedResponse,
} from '@/lib/api/contracts/books';
import { endpoints } from '@/lib/api/endpoints';

function normalizeBestSellingLimit(limit?: number): number | undefined {
  if (typeof limit !== 'number' || Number.isNaN(limit)) return undefined;
  return Math.max(1, Math.min(100, Math.floor(limit)));
}

export const booksService = {
  list(query: BookListQuery = {}) {
    return apiClient.get<PaginatedResponse<BookListItem>>(endpoints.books.list, { query });
  },

  getCatalog(query: { category?: string } = {}) {
    return apiClient.get<unknown>(endpoints.books.list, {
      query: query.category ? { category: query.category } : undefined,
    });
  },

  getBestSelling(query: BestSellingQuery = {}) {
    const limit = normalizeBestSellingLimit(query.limit);
    return apiClient.get<BestSellingBook[]>(endpoints.books.bestSelling, {
      query: limit ? { limit } : undefined,
    });
  },

  getComingSoon(query: { limit?: number } = {}) {
    const limit = normalizeBestSellingLimit(query.limit);
    return apiClient.get<unknown>(endpoints.books.list, {
      query: {
        is_coming_soon: true,
        ...(limit ? { limit } : {}),
      },
    });
  },

  getCategories() {
    return apiClient.get<unknown>(endpoints.books.categories);
  },

  getAuthorOfWeek() {
    return apiClient.get<unknown>(endpoints.books.authorOfWeek);
  },

  getAuthorBySlug(authorSlug: string) {
    return apiClient.get<BookAuthor>(endpoints.books.authorDetail(authorSlug));
  },

  getBooksOfYear(query: { year?: number; limit?: number } = {}) {
    const year =
      typeof query.year === 'number' && Number.isFinite(query.year)
        ? Math.floor(query.year)
        : undefined;
    const limit = normalizeBestSellingLimit(query.limit);

    return apiClient.get<unknown>(endpoints.books.booksOfYear, {
      query: {
        ...(year ? { year } : {}),
        ...(limit ? { limit } : {}),
      },
    });
  },

  getBySlug(bookSlug: string) {
    return apiClient.get<BookDetailResponse>(endpoints.books.detail(bookSlug));
  },

  getById(bookId: string) {
    return apiClient.get<BookDetailResponse>(endpoints.books.detail(bookId));
  },

  like(bookId: string) {
    return apiClient.post<{ liked: true }>(endpoints.books.likes(bookId));
  },

  unlike(bookId: string) {
    return apiClient.delete<{ liked: false }>(endpoints.books.likes(bookId));
  },
};
