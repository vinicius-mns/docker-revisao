import { z } from 'zod'

const tagType = z.enum(['include', 'exclude', 'none'])

const tagInput = z.object({
  emoji: z.string().default(''),
  content: z.string().trim().min(1),
  count: z.number().int().nonnegative().default(0),
  type: tagType.default('none'),
  timestamp: z.coerce.number().default(Date.now()),
})

export const createTagsBody = z.array(tagInput).min(1).max(500)
export const updateTagsBody = z.array(tagInput.extend({ id: z.string().min(1) })).min(1).max(500)
export const deleteTagsBody = z.object({ ids: z.array(z.string().min(1)).min(1) })
export const changeTypeBody = z.object({ ids: z.array(z.string().min(1)).min(1), type: tagType })
export const setTypeBody = z.array(z.object({ ids: z.array(z.string().min(1)).min(1), type: tagType })).min(1)
export const incrementCountBody = z.object({ ids: z.array(z.string().min(1)).min(1), by: z.coerce.number().int().default(1) })
export const decrementCountBody = z.object({ decrements: z.record(z.string(), z.coerce.number().int()) })

export const readTagsQuery = z.object({
  cursor: z.coerce.number().optional(),
  content: z.string().optional(),
  type: tagType.optional(),
})

export type ReadTagsQuery = z.infer<typeof readTagsQuery>
