import { Schema, model } from 'mongoose'

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    emailVerificationTokenHash: {
      type: String,
      select: false,
    },
    emailVerificationExpiresAt: {
      type: Date,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

userSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true })
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true })

export const UserModel = model('User', userSchema)
