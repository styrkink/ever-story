import { OpenAI } from 'openai';
import { z } from 'zod';
import { getStorySystemPrompt } from './prompts/story-system.prompt';
import type { CharacterContext } from './promptBuilder';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StoryParams {
  characterContext: CharacterContext;
  theme: string;
  artStyle: string;
  moral: string;
  ageGroup: string;
  customIdea?: string;
}

export const StoryPageSchema = z.object({
  scene_number: z.number().int().min(1).max(10),
  text: z.string().min(10),
  illustration_prompt: z.string().min(10),
  mood: z.string(),
});

export const StoryResponseSchema = z.object({
  pages: z.array(StoryPageSchema).length(10),
});

export type StoryPage = z.infer<typeof StoryPageSchema>;

export class SafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafetyError';
  }
}

export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenerationError';
  }
}

async function checkContentSafety(text: string) {
  const moderation = await openai.moderations.create({ input: text });
  if (moderation.results[0]?.flagged) {
    throw new SafetyError('Content flagged by safety moderation.');
  }
}

const MAX_RETRIES = 3;

export async function generateStoryText(params: StoryParams): Promise<StoryPage[]> {
  if (params.customIdea) {
    await checkContentSafety(params.customIdea);
  }

  const systemPrompt = getStorySystemPrompt(params);

  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_RETRIES) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the story now.' },
        ],
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) throw new GenerationError('No content returned from OpenAI');

      const parsed = JSON.parse(responseContent);
      const validated = StoryResponseSchema.parse(parsed);

      const fullText = validated.pages.map((p) => p.text).join('\n\n');
      await checkContentSafety(fullText);

      return validated.pages;
    } catch (error) {
      attempt++;
      lastError = error;

      if (error instanceof SafetyError) throw error;

      if (attempt >= MAX_RETRIES) {
        throw new GenerationError(
          `Failed to generate story after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new GenerationError(`Unexpected error: ${String(lastError)}`);
}
