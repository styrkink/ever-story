export const INTERESTS_WHITELIST = [
  // Фантазия и приключения
  'dinosaurs', 'princesses', 'magic', 'superheroes', 'dragons',
  'fairies', 'pirates', 'knights',
  // Техника и наука
  'space', 'robots', 'cars', 'experiments', 'inventions', 'electronics',
  // Природа
  'animals', 'sea', 'nature', 'birds', 'insects', 'forest',
  // Творчество
  'music', 'drawing', 'cooking', 'sculpting', 'photography',
  // Спорт и активность
  'sport', 'football', 'swimming', 'cycling', 'dancing', 'gymnastics',
  // Игры и игрушки
  'lego', 'board_games', 'dolls', 'video_games', 'puzzles',
  // Книги и истории
  'fairy_tales', 'comics', 'encyclopedias',
] as const;

export const CHARACTER_TRAITS_WHITELIST = [
  'brave', 'curious', 'kind', 'cheerful', 'creative', 'stubborn',
  'cautious', 'empathetic', 'energetic', 'dreamy', 'smart', 'mischievous',
  'patient', 'calm', 'polite', 'friendly', 'caring', 'attentive',
  'determined', 'independent', 'responsible', 'accurate', 'serious',
  'leader', 'artistic', 'humorous',
] as const;

export const HAIR_COLORS = [
  'not_specified', 'black', 'dark_brown', 'brown',
  'light_brown', 'dark_blonde', 'light_blonde', 'red', 'platinum',
] as const;

export const EYE_COLORS = [
  'not_specified', 'dark_brown', 'brown', 'green',
  'light_blue', 'blue', 'grey', 'amber',
] as const;

export const APPEARANCE_FEATURES = [
  'glasses', 'freckles', 'curly_hair', 'braids', 'short_hair', 'long_hair',
] as const;

export const VISIBLE_FEATURES = [
  'wheelchair', 'hearing_aid', 'white_cane',
  'arm_prosthesis', 'leg_prosthesis',
] as const;

export const PET_TYPES = [
  'cat', 'dog', 'rabbit', 'parrot', 'turtle', 'fish',
] as const;

export type Interest = (typeof INTERESTS_WHITELIST)[number];
export type CharacterTrait = (typeof CHARACTER_TRAITS_WHITELIST)[number];
export type HairColor = (typeof HAIR_COLORS)[number];
export type EyeColor = (typeof EYE_COLORS)[number];
export type AppearanceFeature = (typeof APPEARANCE_FEATURES)[number];
export type VisibleFeature = (typeof VISIBLE_FEATURES)[number];
export type PetType = (typeof PET_TYPES)[number];
