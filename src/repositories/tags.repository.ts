import { CardModel } from '../models/card.model.js'
import { TagModel } from '../models/tag.model.js'
import type { ReadTagsQuery } from '../schemas/tags.schema.js'

const PAGE_SIZE = 5000

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const tagsRepository = {
  async create(tags: { emoji: string; content: string; count: number; type: 'include' | 'exclude' | 'none'; timestamp: number }[]) {
    const now = Date.now()
    const docs = tags.map((tag, index) => ({
      ...tag,
      id: crypto.randomUUID().slice(0, 8),
      timestamp: tag.timestamp ?? now + index,
    }))

    await TagModel.insertMany(docs)
    return docs
  },

  async read({ cursor, content, type }: ReadTagsQuery) {
    const filter: Record<string, unknown> = {}

    if (cursor) {
      filter.timestamp = { $lt: cursor }
    }

    if (content) {
      filter.content = { $regex: escapeRegExp(content), $options: 'i' }
    }

    if (type) {
      filter.type = type
    }

    const tags = await TagModel.find(filter)
      .sort({ timestamp: -1 })
      .limit(PAGE_SIZE)
      .lean()

    return {
      tags,
      nextCursor: tags.at(-1)?.timestamp ?? null,
      hasNext: tags.length === PAGE_SIZE,
    }
  },

  async update(tags: { id: string; emoji: string; content: string; count: number; type: 'include' | 'exclude' | 'none'; timestamp: number }[]) {
    const operations = tags.map(({ id, ...changes }) => ({
      updateOne: {
        filter: { id },
        update: { $set: changes },
      },
    }))

    await TagModel.bulkWrite(operations)
  },

  async deleteByIds(ids: string[]) {
    const result = await TagModel.deleteMany({ id: { $in: ids } })
    return result.deletedCount ?? 0
  },

  async deleteUnused() {
    const result = await TagModel.deleteMany({ count: 0 })
    return result.deletedCount ?? 0
  },

  async changeType(ids: string[], type: 'include' | 'exclude' | 'none') {
    const result = await TagModel.updateMany({ id: { $in: ids } }, { $set: { type } })
    return result.modifiedCount ?? 0
  },

  async setType(entries: { ids: string[]; type: 'include' | 'exclude' | 'none' }[]) {
    const operations = entries.map(({ ids, type }) => ({
      updateMany: {
        filter: { id: { $in: ids } },
        update: { $set: { type } },
      },
    }))

    await TagModel.bulkWrite(operations)
    return entries.length
  },

  async increment(ids: string[], by = 1) {
    const result = await TagModel.updateMany(
      { id: { $in: ids } },
      [{ $set: { count: { $max: [0, { $add: ['$count', by] }] } } }],
    )

    return result.modifiedCount ?? 0
  },

  async decrement(decrements: Record<string, number>) {
    const operations = Object.entries(decrements).map(([id, value]) => ({
      updateOne: {
        filter: { id },
        update: [{ $set: { count: { $max: [0, { $subtract: ['$count', value] }] } } }],
      },
    }))

    await TagModel.bulkWrite(operations)
    return Object.keys(decrements).length
  },

  async recount() {
    const counts = await CardModel.aggregate<{ _id: string; count: number }>([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
    ])

    await TagModel.updateMany({}, { $set: { count: 0 } })

    await TagModel.bulkWrite(
      counts.map(({ _id, count }) => ({
        updateOne: {
          filter: { id: _id },
          update: { $set: { count } },
        },
      })),
    )

    return counts.length
  },
}
