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

export interface ImageGenerationParams {
  prompt: string;
  artStyle: string;
  childName?: string;
  aspectRatio?: string; // e.g., "16:9", "1:1", "3:4"
}

export async function generateIllustration(params: ImageGenerationParams): Promise<string> {
  const { prompt, artStyle, childName, aspectRatio = '1:1' } = params;

  if (process.env.MOCK_IMAGE_GEN === 'true') {
    console.log(`[ai-pipeline:image] MOCK MODE: Generating placeholder for prompt: ${prompt}`);
    // Return a nice placeholder from Unsplash or similar
    const keywords = prompt.split(' ').slice(0, 3).join(',');
    return `https://images.unsplash.com/photo-1510172951991-856a654063f9?q=80&w=400&h=400&fit=crop&text=Story+Image`;
  }

  const childContext = childName ? `The main character is a child named ${childName}.` : '';
  const fullPrompt = `${childContext} ${prompt}. Art style: ${artStyle}. High quality illustration, children's book style, vibrant colors.`;

  console.log(`[ai-pipeline:image] Calling Replicate... Prompt: ${fullPrompt}`);

  // Run the Replicate model (black-forest-labs/flux-schnell)
  let output;
  try {
    output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: fullPrompt,
          go_fast: true,
          megapixels: "1",
          num_outputs: 1,
          output_format: "webp",
          output_quality: 80,
          aspect_ratio: aspectRatio,
        }
      }
    );
  } catch(error) {
    console.error('[ai-pipeline:image] Replicate error:', error);
    throw new Error('Failed to generate image via Replicate.');
  }

  // The output from flux-schnell is an array of streams/URLs or file objects depending on the replicate client version
  // Wait, let's just make sure we handle strings / Readable streams
  const fileOutput = Array.isArray(output) ? output[0] : output;
  if (!fileOutput) {
    throw new Error('No output from Replicate');
  }

  let buffer: Buffer;
  
  if (typeof fileOutput === 'string' && fileOutput.startsWith('http')) {
    // If it's a URL, download it
    const res = await fetch(fileOutput);
    if (!res.ok) throw new Error(`Failed to download image from Replicate: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else if (typeof fileOutput?.url === 'function') {
    // Handling FileOutput object from modern replicate SDK
    const url = await fileOutput.url();
    const res = await fetch(url.href ?? url);
    const arrayBuffer = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    // Assuming fileOutput is a readable stream or object, though Replicate usually gives URLs or FileOutputs
    throw new Error('Unexpected output format from Replicate');
  }

  // Upload to S3
  const key = `illustrations/${uuidv4()}.webp`;
  const bucket = process.env.S3_BUCKET_NAME!;

  console.log(`[ai-pipeline:image] Uploading to S3 bucket ${bucket} as ${key}...`);
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
    });
    
    await s3Client.send(command);
  } catch (error) {
    console.error('[ai-pipeline:image] S3 upload error:', error);
    throw new Error('Failed to upload image to S3.');
  }

  // Construct URL based on AWS standard
  // If bucker has custom domain it will differ, but let's use the default domain
  const finalUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  console.log(`[ai-pipeline:image] Image uploaded successfully: ${finalUrl}`);

  return finalUrl;
}
