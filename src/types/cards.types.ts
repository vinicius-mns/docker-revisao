export interface ICard {
  id: string
  date: Date
  timestamp: number
  content: string
  tags: string[]
}

export type CardCreateInput = Omit<ICard, 'id' | 'timestamp'>
export type CardUpdateInput = ICard
