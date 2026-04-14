import { OpenAI } from 'openai';
import { z } from 'zod';
import { getStorySystemPrompt } from './prompts/story-system.prompt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StoryParams {
  childName: string;
  theme: string;
  artStyle: string;
  moral: string;
  ageGroup: string;
  petName?: string;
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

/**
 * Generates the text, illustration prompts, and mood for a 10-page story using OpenAI.
 * Incorporates safety moderation checks before and after generation, and automatic retries.
 */
export async function generateStoryText(params: StoryParams): Promise<StoryPage[]> {
  // 1. Content Safety check on custom idea (if provided)
  if (params.customIdea) {
    await checkContentSafety(params.customIdea);
  }

  // 2. Build systemPrompt from template
  const systemPrompt = getStorySystemPrompt(params);

  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_RETRIES) {
    try {
      // 3. Call OpenAI chat completions
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the story now.' }
        ],
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new GenerationError('No content returned from OpenAI');
      }

      // 4 & 5. Parse JSON and validate through Zod schema
      const parsed = JSON.parse(responseContent);
      const validated = StoryResponseSchema.parse(parsed);

      // 6. Secondary Content Safety check on the generated text
      const fullText = validated.pages.map(p => p.text).join('\n\n');
      await checkContentSafety(fullText);

      // 7. Return the valid pages array
      return validated.pages;
    } catch (error) {
      attempt++;
      lastError = error;

      // Don't retry if it's a safety violation or we hit the max retry limit
      if (error instanceof SafetyError) {
        throw error;
      }

      if (attempt >= MAX_RETRIES) {
        throw new GenerationError(`Failed to generate story after ${MAX_RETRIES} attempts: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new GenerationError(`Unexpected error: ${String(lastError)}`);
}
