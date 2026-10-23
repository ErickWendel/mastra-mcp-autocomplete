import type { z } from 'zod'
import type { schema } from '../mastra/form/schema.ts'

// A talk as the form holds it, straight from the zod schema (every field optional).
export type Talk = z.infer<typeof schema>
