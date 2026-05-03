import Replicate from 'replicate';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface AppearanceHint {
  hairColor?: string;
  eyeColor?: string;
  features?: string[];
}

export interface ImageGenerationParams {
  prompt: string;
  artStyle: string;
  childName?: string;
  aspectRatio?: string;
  /** True when a face embedding is available — skip text appearance injection. */
  hasEmbedding?: boolean;
  /** Used to enrich the prompt when hasEmbedding is false. */
  appearanceHint?: AppearanceHint;
}

function buildAppearanceDescription(hint: AppearanceHint): string {
  const parts: string[] = [];
  if (hint.hairColor && hint.hairColor !== 'not_specified') {
    parts.push(`${hint.hairColor.replace(/_/g, ' ')} hair`);
  }
  if (hint.eyeColor && hint.eyeColor !== 'not_specified') {
    parts.push(`${hint.eyeColor.replace(/_/g, ' ')} eyes`);
  }
  if (hint.features?.length) {
    parts.push(...hint.features.map((f) => f.replace(/_/g, ' ')));
  }
  return parts.length > 0 ? `The child has ${parts.join(', ')}.` : '';
}

export async function generateIllustration(params: ImageGenerationParams): Promise<string> {
  const {
    prompt,
    artStyle,
    childName,
    aspectRatio = '1:1',
    hasEmbedding = false,
    appearanceHint,
  } = params;

  if (process.env.MOCK_IMAGE_GEN === 'true') {
    console.log(`[ai-pipeline:image] MOCK MODE: Generating placeholder for prompt: ${prompt}`);
    return `https://images.unsplash.com/photo-1510172951991-856a654063f9?q=80&w=400&h=400&fit=crop&text=Story+Image`;
  }

  const childContext = childName ? `The main character is a child named ${childName}.` : '';

  let appearanceContext = '';
  if (!hasEmbedding && appearanceHint) {
    appearanceContext = buildAppearanceDescription(appearanceHint);
  }

  const fullPrompt = [
    childContext,
    appearanceContext,
    prompt,
    `Art style: ${artStyle}.`,
    'High quality illustration, children\'s book style, vibrant colors.',
  ]
    .filter(Boolean)
    .join(' ');

  console.log(`[ai-pipeline:image] Calling Replicate... Prompt: ${fullPrompt}`);

  let output;
  try {
    output = await replicate.run('black-forest-labs/flux-schnell', {
      input: {
        prompt: fullPrompt,
        go_fast: true,
        megapixels: '1',
        num_outputs: 1,
        output_format: 'webp',
        output_quality: 80,
        aspect_ratio: aspectRatio,
      },
    });
  } catch (error) {
    console.error('[ai-pipeline:image] Replicate error:', error);
    throw new Error('Failed to generate image via Replicate.');
  }

  const fileOutput = Array.isArray(output) ? output[0] : output;
  if (!fileOutput) throw new Error('No output from Replicate');

  let buffer: Buffer;

  if (typeof fileOutput === 'string' && fileOutput.startsWith('http')) {
    const res = await fetch(fileOutput);
    if (!res.ok) throw new Error(`Failed to download image from Replicate: ${res.statusText}`);
    buffer = Buffer.from(await res.arrayBuffer());
  } else if (typeof fileOutput?.url === 'function') {
    const url = await fileOutput.url();
    const res = await fetch(url.href ?? url);
    buffer = Buffer.from(await res.arrayBuffer());
  } else {
    throw new Error('Unexpected output format from Replicate');
  }

  const key = `illustrations/${uuidv4()}.webp`;
  const bucket = process.env.S3_BUCKET_NAME!;

  console.log(`[ai-pipeline:image] Uploading to S3 bucket ${bucket} as ${key}...`);
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
      })
    );
  } catch (error) {
    console.error('[ai-pipeline:image] S3 upload error:', error);
    throw new Error('Failed to upload image to S3.');
  }

  const finalUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  console.log(`[ai-pipeline:image] Image uploaded successfully: ${finalUrl}`);
  return finalUrl;
}
