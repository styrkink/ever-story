import { z } from 'zod';
import {
  INTERESTS_WHITELIST,
  CHARACTER_TRAITS_WHITELIST,
  HAIR_COLORS,
  EYE_COLORS,
  APPEARANCE_FEATURES,
  VISIBLE_FEATURES,
  PET_TYPES,
} from '../../constants/childProfile';

function isAgeBetween(birthDateStr: string, minYears: number, maxYears: number): boolean {
  const birth = new Date(birthDateStr);
  const today = new Date();
  const minBirth = new Date(today);
  minBirth.setFullYear(minBirth.getFullYear() - maxYears);
  const maxBirth = new Date(today);
  maxBirth.setFullYear(maxBirth.getFullYear() - minYears);
  return birth >= minBirth && birth <= maxBirth;
}

const birthDateField = z
  .string()
  .datetime({ message: 'Must be a valid ISO 8601 date string' })
  .refine((d) => isAgeBetween(d, 1, 18), {
    message: 'Child must be between 1 and 18 years old',
  });

// ── Step 1: Basic info ──────────────────────────────────────────────────────

export const step1Schema = z.object({
  name: z.string().min(1).max(50),
  nickname: z.string().max(30).optional(),
  birthDate: birthDateField,
  gender: z.enum(['BOY', 'GIRL', 'NOT_SPECIFIED']),
});

// ── Step 2: Interests & personalization ────────────────────────────────────

export const step2Schema = z.object({
  interests: z
    .array(z.enum(INTERESTS_WHITELIST))
    .max(10, 'A maximum of 10 interests are allowed')
    .default([]),
  characterTraits: z.array(z.enum(CHARACTER_TRAITS_WHITELIST)).default([]),
  recentAchievements: z.string().max(300).optional(),
  dreamsAndGoals: z.string().max(300).optional(),
  petType: z.enum(PET_TYPES).optional(),
  petName: z.string().max(30).optional(),
});

// ── Step 3: Appearance (text fields — photo via POST /:id/photo) ───────────

export const step3Schema = z.object({
  hairColor: z.enum(HAIR_COLORS).optional(),
  eyeColor: z.enum(EYE_COLORS).optional(),
  appearanceFeatures: z.array(z.enum(APPEARANCE_FEATURES)).default([]),
  visibleFeatures: z.array(z.enum(VISIBLE_FEATURES)).default([]),
  specialNotes: z.string().max(500).optional(),
});

// ── Full create/update (all steps combined) ────────────────────────────────

export const createChildSchema = step1Schema.merge(step2Schema).merge(step3Schema);

export const updateChildSchema = createChildSchema;

// ── Patch query ─────────────────────────────────────────────────────────────

export const patchQuerySchema = z.object({
  step: z.enum(['1', '2', '3']),
});

// ── Route params ────────────────────────────────────────────────────────────

export const childParamsSchema = z.object({
  id: z.string().uuid(),
});

// ── Types ────────────────────────────────────────────────────────────────────

export type CreateChildInput = z.infer<typeof createChildSchema>;
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
export type Step1Input = z.infer<typeof step1Schema>;
export type Step2Input = z.infer<typeof step2Schema>;
export type Step3Input = z.infer<typeof step3Schema>;
export type ChildParamsInput = z.infer<typeof childParamsSchema>;
