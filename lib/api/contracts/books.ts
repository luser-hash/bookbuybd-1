export type BookSort = 'popular' | 'rating' | 'reviews' | 'newest';

export type BookStatus = 'published' | 'coming_soon';

export interface BookListQuery {
  genre?: string;
  sort?: BookSort;
  status?: BookStatus;
  bestseller?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface BookListItem {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  price: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  likes?: number;
  genre?: string;
  excerpt?: string;
  badges?: string[];
  expectedDate?: string;
  inStock?: boolean;
}

export interface BookDetails extends BookListItem {
  description?: string;
  publishedAt?: string;
  isbn?: string;
  pages?: number;
  language?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface BestSellingQuery {
  limit?: number;
}

export interface BestSellingBook {
  id: number;
  title: string;
  slug: string;
  author: string;
  image: string;
  price: string;
  category_name: string;
  total_sold: number;
}
