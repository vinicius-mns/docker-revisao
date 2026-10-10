import { CardModel } from '../models/card.model.ts'
import { TagModel } from '../models/tag.model.ts'
import type { ReadCardsQuery } from '../schemas/cards.schema.ts'
import { HttpError } from '../middlewares/error.ts'

const PAGE_SIZE = 50

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const toCard = <T extends { _id: { toString(): string } }>({ _id, ...card }: T) => ({
  id: _id.toString(),
  ...card,
})

const ensureTagsBelongToUser = async (ownerId: string, tagIds: string[]) => {
  const uniqueTagIds = [...new Set(tagIds)]
  if (!uniqueTagIds.length) {
    return
  }

  const count = await TagModel.countDocuments({ ownerId, _id: { $in: uniqueTagIds } })
  if (count !== uniqueTagIds.length) {
    throw new HttpError(400, 'Uma ou mais tags não existem para este usuário')
  }
}

export const cardsRepository = {
  async create(ownerId: string, cards: { date: Date; content: string; tags: string[] }[]) {
    await ensureTagsBelongToUser(ownerId, cards.flatMap((card) => card.tags))
    const now = Date.now()
    const docs = cards.map((card, index) => ({
      ...card,
      ownerId,
      date: new Date(card.date),
      timestamp: now + index,
    }))

    const created = await CardModel.insertMany(docs)
    return created.map((doc) => toCard(doc.toObject()))
  },

  async readById(ownerId: string, id: string) {
    const card = await CardModel.findOne({ ownerId, _id: id }).lean()
    return card ? toCard(card) : null
  },

  async readByQuery(ownerId: string, { cursor, content, include = [], exclude = [] }: ReadCardsQuery) {
    const filter: Record<string, unknown> = { ownerId }

    if (cursor !== undefined) {
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

    const docs = await CardModel.find(filter)
      .sort({ timestamp: -1 })
      .limit(PAGE_SIZE)
      .lean()

    const cards = docs.map(toCard)

    return {
      cards,
      nextCursor: cards.at(-1)?.timestamp ?? null,
      hasNext: cards.length === PAGE_SIZE,
    }
  },

  async update(ownerId: string, cards: { id: string; date: Date; content: string; tags: string[] }[]) {
    await ensureTagsBelongToUser(ownerId, cards.flatMap((card) => card.tags))
    const now = Date.now()

    const operations = cards.map(({ id, ...changes }, index) => ({
      updateOne: {
        filter: { ownerId, _id: id },
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

  async deleteByIds(ownerId: string, ids: string[]) {
    const result = await CardModel.deleteMany({ ownerId, _id: { $in: ids } })
    return result.deletedCount ?? 0
  },

  async deleteByTag(ownerId: string, tagId: string) {
    const result = await CardModel.deleteMany({ ownerId, tags: tagId })
    return result.deletedCount ?? 0
  },

  async removeTags(ownerId: string, tagIds: string[]) {
    const counts = await Promise.all(tagIds.map((id) => CardModel.countDocuments({ ownerId, tags: id })))

    await CardModel.updateMany({ ownerId, tags: { $in: tagIds } }, { $pull: { tags: { $in: tagIds } } })

    return counts
  },
}