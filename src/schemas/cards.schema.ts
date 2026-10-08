import { z } from 'zod'

const uniqueTags = z
  .array(z.string().trim().min(1))
  .refine((values) => new Set(values).size === values.length, 'Tag duplicada')

const cardInput = z.object({
  date: z.coerce.date(),
  content: z.string().trim().min(2),
  tags: uniqueTags.default([]),
})

export const createCardsBody = z.array(cardInput).min(1).max(500)
export const updateCardsBody = z
  .array(cardInput.extend({ id: z.string().min(1) }))
  .min(1)
  .max(500)
export const deleteCardsBody = z.object({ ids: z.array(z.string().min(1)).min(1) })
export const removeTagsBody = z.object({ tagIds: z.array(z.string().min(1)).min(1) })

const csv = z
  .string()
  .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
  .optional()

export const readCardsQuery = z.object({
  cursor: z.coerce.number().optional(),
  content: z.string().optional(),
  include: csv,
  exclude: csv,
})

export type ReadCardsQuery = z.infer<typeof readCardsQuery>
