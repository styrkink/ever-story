export interface FaceServiceResult {
  faceFound: boolean;
  qualityScore: number;
  embedding: number[];
}

export class FaceService {
  /**
   * Mock implementation of extracting face embedding from an image
   * @param base64Image Base64 encoded image string
   */
  static async extractEmbedding(base64Image: string): Promise<FaceServiceResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // For the MVP mock, we assume the face is generally found and quality is acceptable.
    // In a real scenario, this would call a python microservice endpoint.
    const randomQuality = 0.5 + Math.random() * 0.5; // Quality between 0.5 and 1.0

    // Generate a random vector of 512 dimensions
    const embedding = Array.from({ length: 512 }, () => Math.random() * 2 - 1);

    return {
      faceFound: true,
      qualityScore: randomQuality,
      embedding,
    };
  }
}
