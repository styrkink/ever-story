import { env } from '../config/env';

export interface FaceServiceResult {
  faceFound: boolean;
  qualityScore: number;
  embedding: number[];
}

export class FaceService {
  static async extractEmbedding(base64Image: string): Promise<FaceServiceResult> {
    if (!env.FACE_SERVICE_URL) {
      return FaceService.mock();
    }

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 30_000);

    try {
      const res = await fetch(`${env.FACE_SERVICE_URL}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Face service responded ${res.status}: ${text}`);
      }

      return (await res.json()) as FaceServiceResult;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new Error('Face service timed out (30s)');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // Used when FACE_SERVICE_URL is not configured (local dev without Python service)
  private static async mock(): Promise<FaceServiceResult> {
    await new Promise((r) => setTimeout(r, 200));
    const raw = Array.from({ length: 512 }, () => Math.random() * 2 - 1);
    const norm = Math.sqrt(raw.reduce((s, x) => s + x * x, 0));
    return {
      faceFound: true,
      qualityScore: 0.5 + Math.random() * 0.5,
      embedding: raw.map((x) => x / norm),
    };
  }
}
