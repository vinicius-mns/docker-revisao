import { CardModel } from '../models/card.model.ts'
import { TagModel } from '../models/tag.model.ts'
import type { ReadTagsQuery } from '../schemas/tags.schema.ts'

const PAGE_SIZE = 5000

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const toTag = <T extends { _id: { toString(): string } }>({ _id, ...tag }: T) => ({
  id: _id.toString(),
  ...tag,
})

export const tagsRepository = {
  async create(ownerId: string, tags: { emoji: string; content: string; type: 'include' | 'exclude' | 'none' }[]) {
    const now = Date.now()
    const docs = tags.map((tag, index) => ({
      ...tag,
      ownerId,
      count: 0,
      timestamp: now + index,
    }))

    const created = await TagModel.insertMany(docs)
    return created.map((doc) => toTag(doc.toObject()))
  },

  async read(ownerId: string, { cursor, content, type }: ReadTagsQuery) {
    const filter: Record<string, unknown> = { ownerId }

    if (cursor !== undefined) {
      filter.timestamp = { $lt: cursor }
    }

    if (content) {
      filter.content = { $regex: escapeRegExp(content), $options: 'i' }
    }

    if (type) {
      filter.type = type
    }

    const docs = await TagModel.find(filter)
      .sort({ timestamp: -1 })
      .limit(PAGE_SIZE)
      .lean()

    const tags = docs.map(toTag)

    return {
      tags,
      nextCursor: tags.at(-1)?.timestamp ?? null,
      hasNext: tags.length === PAGE_SIZE,
    }
  },

  async update(ownerId: string, tags: { id: string; emoji: string; content: string; type: 'include' | 'exclude' | 'none' }[]) {
    const operations = tags.map(({ id, ...changes }) => ({
      updateOne: {
        filter: { ownerId, _id: id },
        update: { $set: changes },
      },
    }))

    await TagModel.bulkWrite(operations)
  },

  async deleteByIds(ownerId: string, ids: string[]) {
    const result = await TagModel.deleteMany({ ownerId, _id: { $in: ids } })
    return result.deletedCount ?? 0
  },

  async deleteUnused(ownerId: string) {
    const result = await TagModel.deleteMany({ ownerId, count: 0 })
    return result.deletedCount ?? 0
  },

  async changeType(ownerId: string, ids: string[], type: 'include' | 'exclude' | 'none') {
    const result = await TagModel.updateMany({ ownerId, _id: { $in: ids } }, { $set: { type } })
    return result.modifiedCount ?? 0
  },

  async setType(ownerId: string, entries: { ids: string[]; type: 'include' | 'exclude' | 'none' }[]) {
    const operations = entries.map(({ ids, type }) => ({
      updateMany: {
        filter: { ownerId, _id: { $in: ids } },
        update: { $set: { type } },
      },
    }))

    await TagModel.bulkWrite(operations)
    return entries.length
  },

  async increment(ownerId: string, ids: string[], by = 1) {
    const result = await TagModel.updateMany(
      { ownerId, _id: { $in: ids } },
      [{ $set: { count: { $max: [0, { $add: ['$count', by] }] } } }],
    )

    return result.modifiedCount ?? 0
  },

  async decrement(ownerId: string, decrements: Record<string, number>) {
    const operations = Object.entries(decrements).map(([id, value]) => ({
      updateOne: {
        filter: { ownerId, _id: id },
        update: [{ $set: { count: { $max: [0, { $subtract: ['$count', value] }] } } }],
      },
    }))

    await TagModel.bulkWrite(operations)
    return Object.keys(decrements).length
  },

  async recount(ownerId: string) {
    const counts = await CardModel.aggregate<{ _id: string; count: number }>([
      { $match: { ownerId } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
    ])

    await TagModel.updateMany({ ownerId }, { $set: { count: 0 } })

    if (counts.length) {
      await TagModel.bulkWrite(
        counts.map(({ _id, count }) => ({
          updateOne: {
            filter: { ownerId, _id },
            update: { $set: { count } },
          },
        })),
      )
    }

    return counts.length
  },
}