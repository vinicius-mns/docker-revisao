import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      MONGODB_URI: 'mongodb://127.0.0.1/test',
    },
  },
})
