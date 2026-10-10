import { z } from 'zod'

import { objectIdSchema } from './object-id.schema.ts'

const tagType = z.enum(['include', 'exclude', 'none'])
const tagIds = z.array(objectIdSchema).min(1)

const tagInput = z.object({
  emoji: z.string().default(''),
  content: z.string().trim().min(1),
  type: tagType.default('none'),
})

export const createTagsBody = z.array(tagInput).min(1).max(500)

export const updateTagsBody = z
  .array(z.object({
    id: objectIdSchema,
    emoji: z.string(),
    content: z.string().trim().min(1),
    type: tagType,
  }))
  .min(1)
  .max(500)

export const deleteTagsBody = z.object({
  ids: tagIds,
})

export const changeTypeBody = z.object({
  ids: tagIds,
  type: tagType,
})

export const setTypeBody = z.array(z.object({
  ids: tagIds,
  type: tagType,
})).min(1)

export const incrementCountBody = z.object({
  ids: tagIds,
  by: z.coerce.number().int().default(1),
})

export const decrementCountBody = z.object({
  decrements: z.record(objectIdSchema, z.coerce.number().int()).refine((value) => Object.keys(value).length > 0),
})

export const readTagsQuery = z.object({
  cursor: z.coerce.number().optional(),
  content: z.string().optional(),
  type: tagType.optional(),
})

export type ReadTagsQuery = z.infer<typeof readTagsQuery>