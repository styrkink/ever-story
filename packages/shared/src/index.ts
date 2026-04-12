import { z } from 'zod';

export const ExampleSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Example = z.infer<typeof ExampleSchema>;
