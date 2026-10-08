import { nanoid } from 'nanoid'

import { CardModel } from '../models/card.model.js'
import type { ReadCardsQuery } from '../schemas/cards.schema.js'

const PAGE_SIZE = 50

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const cardsRepository = {
  async create(cards: { date: Date; content: string; tags: string[] }[]) {
    const now = Date.now()
    const docs = cards.map((card, index) => ({
      ...card,
      id: nanoid(8),
      date: new Date(card.date),
      timestamp: now + index,
    }))

    await CardModel.insertMany(docs)
    return docs
  },

  readById(id: string) {
    return CardModel.findOne({ id }).lean()
  },

  async readByQuery({ cursor, content, include = [], exclude = [] }: ReadCardsQuery) {
    const filter: Record<string, unknown> = {}

    if (cursor) {
      filter.timestamp = { $lt: cursor }
    }

    if (content) {
      filter.content = { $regex: escapeRegExp(content), $options: 'i' }
    }

    if (include.length || exclude.length) {
      filter.tags = {}

      if (include.length) {
        ;(filter.tags as Record<string, unknown>).$all = include
      }

      if (exclude.length) {
        ;(filter.tags as Record<string, unknown>).$nin = exclude
      }
    }

    const cards = await CardModel.find(filter)
      .sort({ timestamp: -1 })
      .limit(PAGE_SIZE)
      .lean()

    return {
      cards,
      nextCursor: cards.at(-1)?.timestamp ?? null,
      hasNext: cards.length === PAGE_SIZE,
    }
  },

  async update(cards: { id: string; date: Date; content: string; tags: string[] }[]) {
    const now = Date.now()

    const operations = cards.map(({ id, ...changes }, index) => ({
      updateOne: {
        filter: { id },
        update: {
          $set: {
            ...changes,
            date: new Date(changes.date),
            timestamp: now + index,
          },
        },
      },
    }))

    await CardModel.bulkWrite(operations)
  },

  async deleteByIds(ids: string[]) {
    const result = await CardModel.deleteMany({ id: { $in: ids } })
    return result.deletedCount ?? 0
  },

  async deleteByTag(tagId: string) {
    const result = await CardModel.deleteMany({ tags: tagId })
    return result.deletedCount ?? 0
  },

  async removeTags(tagIds: string[]) {
    const counts = await Promise.all(tagIds.map((id) => CardModel.countDocuments({ tags: id })))

    await CardModel.updateMany({ tags: { $in: tagIds } }, { $pull: { tags: { $in: tagIds } } })

    return counts
  },
}
