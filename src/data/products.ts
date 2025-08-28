export type Product = { id: string; name: string; category: string; summary: string }

export const products: Product[] = [
  { id: 'p1', name: 'Calm Breathing', category: 'exercise', summary: '2-5 min guided breathing' },
  { id: 'p2', name: 'Sleep Routine', category: 'guide', summary: 'Wind-down checklist for better sleep' },
  { id: 'p3', name: 'Journaling', category: 'cbt', summary: 'Prompted reflection to reframe thoughts' }
]

export const getProducts = () =>
  new Promise<Product[]>(res => setTimeout(() => res(products), 300))
