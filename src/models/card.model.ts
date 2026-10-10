import { type InferSchemaType, Schema, model } from 'mongoose'
import { nanoid } from 'nanoid'

const cardSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(8),
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
      minlength: 2,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    versionKey: false,
  },
)

cardSchema.index({ ownerId: 1, timestamp: -1 })
cardSchema.index({ ownerId: 1, tags: 1 })

export type CardDocument = InferSchemaType<typeof cardSchema>

export const CardModel = model<CardDocument>('Card', cardSchema)
