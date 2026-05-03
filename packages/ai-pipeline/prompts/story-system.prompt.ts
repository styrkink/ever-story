import type { CharacterContext } from '../promptBuilder';

export const getStorySystemPrompt = (params: {
  characterContext: CharacterContext;
  theme: string;
  artStyle: string;
  moral: string;
  ageGroup: string;
  customIdea?: string;
}): string => {
  const { characterContext: char, theme, artStyle, moral, ageGroup, customIdea } = params;

  const pronouns =
    char.gender === 'BOY'
      ? { subject: 'he', object: 'him', possessive: 'his' }
      : char.gender === 'GIRL'
      ? { subject: 'she', object: 'her', possessive: 'her' }
      : { subject: 'they', object: 'them', possessive: 'their' };

  const petLine =
    char.pet
      ? `- Pet/Companion: ${char.pet.name} the ${char.pet.type}`
      : '';

  const interestsLine =
    char.interests.length > 0
      ? `- Passions & Interests: ${char.interests.join(', ')} — weave these naturally as story themes`
      : '';

  const traitsLine =
    char.traits.length > 0
      ? `- Character traits (use to shape ${pronouns.possessive} decisions and behavior): ${char.traits.join(', ')}`
      : '';

  let extraRules = '';

  if (char.restrictions) {
    extraRules += `\nNEVER MENTION: Never mention or reference: ${char.restrictions}. Do not include any food, activity, or situation related to these.`;
  }

  if (char.appearance.visibleFeatures.length > 0) {
    for (const feature of char.appearance.visibleFeatures) {
      extraRules += `\nThe hero's ${feature.replace(/_/g, ' ')} is their unique strength — write it as a superpower or special ability, never as a limitation or obstacle.`;
    }
  }

  if (char.recentAchievement) {
    extraRules += `\nWeave this naturally into the story as something the hero is proud of: "${char.recentAchievement}"`;
  }

  if (char.dream) {
    extraRules += `\nCast the hero in this role within the story world: "${char.dream}"`;
  }

  return `You are a talented children's book author. Your task is to write a personalized, engaging, and age-appropriate story.

The story must strictly follow these parameters:
- Protagonist Name: ${char.name} (use pronouns: ${pronouns.subject}/${pronouns.object}/${pronouns.possessive})
- Age: ${char.age} years old
- Theme: ${theme}
- Art Style (for illustration prompts): ${artStyle}
- Moral/Lesson: ${moral}
- Target Age Group: ${ageGroup}
${petLine}
${interestsLine}
${traitsLine}
${customIdea ? `- Custom Idea to Include: ${customIdea}` : ''}

SAFETY RULES:
- Do not include any violence, scary elements, inappropriate language, or adult themes.
- The tone should be positive, encouraging, and magical.
- Refer to the protagonist by name or correct pronouns only.
${extraRules}

OUTPUT FORMAT:
Provide the output strictly as a JSON object with a single root property "pages" which is an array of exactly 10 objects. Each object must have:
- "scene_number": A number from 1 to 10.
- "text": The story text for that page (about 2-4 sentences, suitable for the age group).
- "illustration_prompt": A highly detailed prompt for an AI image generator to create the illustration for this page. Must include the art style specified above.
- "mood": A single word or short phrase describing the emotional tone of the scene.

Return ONLY valid JSON. Wait for no further instructions.`;
};
