import mongoose from 'mongoose'

import { env } from './env.js'

export const connectDb = async (uri: string = env.MONGODB_URI) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  return mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  })
}

export const disconnectDb = async () => {
  if (mongoose.connection.readyState === 0) {
    return
  }

  await mongoose.disconnect()
}
