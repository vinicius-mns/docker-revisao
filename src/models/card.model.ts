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

cardSchema.index({ timestamp: -1 })
cardSchema.index({ tags: 1 })

export type CardDocument = InferSchemaType<typeof cardSchema>

export const CardModel = model<CardDocument>('Card', cardSchema)
