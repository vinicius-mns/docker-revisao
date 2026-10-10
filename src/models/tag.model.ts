import { type InferSchemaType, Schema, model } from 'mongoose'

const tagSchema = new Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    emoji: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    type: {
      type: String,
      enum: ['include', 'exclude', 'none'],
      default: 'none',
    },
    timestamp: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
  },
)

tagSchema.index({ ownerId: 1, timestamp: -1 })

type TagDocument = InferSchemaType<typeof tagSchema>

export const TagModel = model<TagDocument>('Tag', tagSchema)
