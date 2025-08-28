import { defineStore } from 'pinia'
export type Review = { id: string; userId: string; rating: number; title: string; comment: string }

export const useReviewsStore = defineStore('reviews', {
  state: () => ({ items: [] as Review[] }),
  getters: {
    average: (s) => s.items.length ? (s.items.reduce((a,r)=> a + r.rating, 0) / s.items.length).toFixed(1) : '0.0',
    count: (s) => s.items.length
  },
  actions: {
    add(review: Review) { this.items.push(review) }
  }
})
