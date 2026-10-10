declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string
        sessionToken: string
      }
    }
  }
}

export {}
