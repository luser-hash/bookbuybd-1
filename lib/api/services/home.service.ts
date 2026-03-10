import type { HomeCategoryCard, HomeSummary, HeroSlide, Testimonial } from '@/lib/api/contracts/home';
import { endpoints } from '@/lib/api/endpoints';
import { buildHomeSummaryFallback } from '@/lib/api/fallback/home';
import { apiClient } from '@/lib/api/client';

export const homeService = {
  getSummary() {
    return apiClient.get<HomeSummary>(endpoints.home.summary, {
      cache: 'no-store',
    });
  },

  getHeroSlides() {
    return apiClient.get<HeroSlide[]>(endpoints.home.heroSlides);
  },

  getTrendingSearches() {
    return apiClient.get<string[]>(endpoints.home.trendingSearches);
  },

  getFeaturedCategories() {
    return apiClient.get<HomeCategoryCard[]>(endpoints.home.featuredCategories, {
      query: { featured: true },
    });
  },

  getTestimonials(limit = 9) {
    return apiClient.get<Testimonial[]>(endpoints.home.testimonials, {
      query: { limit },
    });
  },

  async getSummaryWithFallback() {
    try {
      return await this.getSummary();
    } catch {
      return buildHomeSummaryFallback();
    }
  },
};

