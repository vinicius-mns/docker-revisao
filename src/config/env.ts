import { envSchema } from "../schemas/env.schema.ts";

export const env = envSchema.parse(process.env)
