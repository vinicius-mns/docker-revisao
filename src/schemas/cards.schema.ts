import { z } from 'zod'

import { objectIdSchema } from './object-id.schema.ts'

const uniqueTags = z
  .array(objectIdSchema)
  .refine((values) => new Set(values).size === values.length, 'Tag duplicada')

const cardInput = z.object({
  date: z.coerce.date(),
  content: z.string().trim().min(2),
  tags: uniqueTags.default([]),
})

export const createCardsBody = z.array(cardInput).min(1).max(500)

export const updateCardsBody = z
  .array(cardInput.extend({ id: objectIdSchema }))
  .min(1)
  .max(500)

export const deleteCardsBody = z.object({ ids: z.array(objectIdSchema).min(1) })

export const removeTagsBody = z.object({ tagIds: z.array(objectIdSchema).min(1) })

const csv = z
  .string()
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
  .pipe(z.array(objectIdSchema))
  .optional()

export const readCardsQuery = z.object({
  cursor: z.coerce.number().optional(),
  content: z.string().optional(),
  include: csv,
  exclude: csv,
})

export type ReadCardsQuery = z.infer<typeof readCardsQuery>