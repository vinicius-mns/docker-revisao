export type TagType = 'include' | 'exclude' | 'none'

export interface ITag {
  id: string
  emoji: string
  content: string
  count: number
  type: TagType
  timestamp: number
}

export type TagCreateInput = Omit<ITag, 'id'>
export type TagUpdateInput = ITag
