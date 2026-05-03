export interface AppearanceContext {
  hairColor: string | null;
  eyeColor: string | null;
  features: string[];
  visibleFeatures: string[];
}

export interface CharacterContext {
  name: string;
  gender: string;
  age: number;
  interests: string[];
  traits: string[];
  recentAchievement: string | null;
  dream: string | null;
  pet: { type: string; name: string } | null;
  appearance: AppearanceContext;
  restrictions: string | null;
  hasEmbedding: boolean;
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export function buildCharacterContext(child: {
  name: string;
  nickname: string | null;
  birthDate: Date;
  gender: string;
  interests: string[];
  characterTraits: string[];
  recentAchievements: string | null;
  dreamsAndGoals: string | null;
  petType: string | null;
  petName: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  appearanceFeatures: string[];
  visibleFeatures: string[];
  specialNotes: string | null;
  embeddingVector: string | null;
}): CharacterContext {
  return {
    name: child.nickname || child.name,
    gender: child.gender,
    age: calculateAge(child.birthDate),
    interests: child.interests,
    traits: child.characterTraits,
    recentAchievement: child.recentAchievements || null,
    dream: child.dreamsAndGoals || null,
    pet:
      child.petType && child.petName
        ? { type: child.petType, name: child.petName }
        : null,
    appearance: {
      hairColor: child.hairColor || null,
      eyeColor: child.eyeColor || null,
      features: child.appearanceFeatures,
      visibleFeatures: child.visibleFeatures,
    },
    restrictions: child.specialNotes || null,
    hasEmbedding: !!child.embeddingVector,
  };
}
