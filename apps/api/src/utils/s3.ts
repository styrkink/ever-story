import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME!;

/** Extract the S3 object key from a standard AWS S3 URL. Returns null for non-S3 URLs. */
export function extractS3Key(url: string): string | null {
  const match = url.match(/https?:\/\/[^/]+\.s3\.[^/]+\.amazonaws\.com\/(.+)/);
  return match ? match[1] : null;
}

/** Delete multiple S3 objects by key. Silently ignores errors — best-effort cleanup. */
export async function deleteS3Objects(keys: string[]): Promise<void> {
  const valid = keys.filter(Boolean);
  if (valid.length === 0) return;

  try {
    if (valid.length === 1) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: valid[0] }));
      return;
    }

    // Batch delete supports up to 1000 objects per request
    const chunks: string[][] = [];
    for (let i = 0; i < valid.length; i += 1000) {
      chunks.push(valid.slice(i, i + 1000));
    }

    await Promise.all(
      chunks.map((chunk) =>
        s3.send(
          new DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: { Objects: chunk.map((Key) => ({ Key })) },
          })
        )
      )
    );
  } catch (err) {
    console.error('[s3] deleteS3Objects error (non-fatal):', err);
  }
}
