import { z } from 'zod';

export const createChildSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  birthDate: z.string().datetime({ message: 'Must be a valid ISO 8601 date string' }),
  interests: z.array(z.string()).max(10, 'A maximum of 10 interests are allowed').default([]),
  petName: z.string().optional(),
  petType: z.string().optional(),
});

export const updateChildSchema = createChildSchema.partial();

export const childParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateChildInput = z.infer<typeof createChildSchema>;
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
export type ChildParamsInput = z.infer<typeof childParamsSchema>;
