import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface StoryAssemblyParams {
  storyId: string;
  childName: string;
  theme: string;
  artStyle: string;
  createdAt: string;
  isFreeTier: boolean;
  pages: {
    pageNum: number;
    text: string;
    illustrationUrl: string | null;
    audioUrl: string | null;
    wordTimestamps: any | null;
  }[];
}

export interface AssemblyResult {
  manifestUrl: string;
  pdfUrl: string;
}

export async function assembleStory(params: StoryAssemblyParams): Promise<AssemblyResult> {
  const bucket = process.env.S3_BUCKET_NAME!;
  
  console.log(`[ai-pipeline:assembly] Assembling story ${params.storyId}...`);

  // 1. Create Manifest JSON
  const manifest = JSON.stringify({
    storyId: params.storyId,
    childName: params.childName,
    theme: params.theme,
    artStyle: params.artStyle,
    createdAt: params.createdAt,
    pages: params.pages.map(p => ({
      pageNum: p.pageNum,
      text: p.text,
      illustrationUrl: p.illustrationUrl,
      audioUrl: p.audioUrl,
      wordTimestamps: p.wordTimestamps
    })),
  }, null, 2);

  const manifestKey = `stories/${params.storyId}/manifest.json`;

  // 2. Upload Manifest to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: manifestKey,
    Body: manifest,
    ContentType: 'application/json',
  }));

  const manifestUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${manifestKey}`;

  // 3. Generate HTML Template for Book
  const watermarkContent = params.isFreeTier 
    ? '<div class="watermark">Создано в StoryMagic.ai</div>' 
    : '';

  const defaultImage = 'https://images.unsplash.com/photo-1510172951991-856a654063f9?q=80&w=400&h=400&fit=crop&text=Illustration+Missing';

  const pagesHtml = params.pages.map((page, i) => {
    const isEven = i % 2 === 0;
    const sideImg = `
      <div class="half-page image-half">
        <img src="${page.illustrationUrl || defaultImage}" alt="Page ${page.pageNum}" />
      </div>
    `;
    const sideText = `
      <div class="half-page text-half">
        <div class="text-content">
          ${page.text}
        </div>
        ${watermarkContent}
      </div>
    `;

    return `
      <div class="page-container">
        <div class="book-spread">
          <div class="spine"></div>
          ${isEven ? sideImg + sideText : sideText + sideImg}
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700&display=swap');
        
        body {
          font-family: 'Comfortaa', sans-serif;
          margin: 0;
          padding: 0;
          background-color: #2b4028; /* Dark green book cover */
          color: #333;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* A4 Landscape is 297mm x 210mm */
        .page-container {
          width: 297mm;
          height: 210mm;
          page-break-after: always;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 15mm; /* Shows the dark green cover around the edges */
          box-sizing: border-box;
          background: #2b4028; /* Book cover color */
        }
        
        .book-spread {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          background: #fdf6eb; /* Cream paper color */
          border-radius: 4px;
          box-shadow: inset 0 0 30px rgba(139, 115, 85, 0.2), 0 10px 30px rgba(0,0,0,0.5);
          overflow: hidden;
        }
        
        /* The binding crease in the middle */
        .spine {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 40px;
          margin-left: -20px;
          background: linear-gradient(
            to right, 
            rgba(0,0,0,0) 0%, 
            rgba(0,0,0,0.05) 30%, 
            rgba(0,0,0,0.15) 50%, 
            rgba(0,0,0,0.05) 70%, 
            rgba(0,0,0,0) 100%
          );
          z-index: 10;
          pointer-events: none;
        }
        
        .half-page {
          width: 50%;
          height: 100%;
          position: relative;
          box-sizing: border-box;
        }
        
        /* Text side base */
        .text-half {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 50px;
          background-image: 
            radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%);
        }
        
        /* Image side base */
        .image-half {
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .image-half img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        
        .text-content {
          font-size: 1.4rem;
          line-height: 1.8;
          color: #3b2f2f;
          font-weight: 500;
        }
        
        /* Cover styling */
        .cover-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          background: #d94b58; /* Festive red for the inner cover paste */
          color: white;
          padding: 40px;
        }
        
        .cover-title {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: #fdf6eb;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .cover-subtitle {
          font-size: 1.6rem;
          color: #ffd8cd;
        }
        
        .watermark {
          position: absolute;
          bottom: 20px;
          right: 30px;
          font-size: 0.9rem;
          color: rgba(0, 0, 0, 0.4);
          font-weight: bold;
          z-index: 20;
        }
      </style>
    </head>
    <body>
      <!-- Cover Spread -->
      <div class="page-container">
        <div class="book-spread">
          <div class="spine"></div>
          <div class="half-page cover-side" style="background: #2b4028;">
            <!-- Back of the cover or left inside paste -->
          </div>
          <div class="half-page cover-side">
            <div class="cover-title">${params.childName}</div>
            <div class="cover-subtitle">${params.theme.toUpperCase()}</div>
            ${watermarkContent}
          </div>
        </div>
      </div>
      
      ${pagesHtml}
    </body>
    </html>
  `;

  console.log(`[ai-pipeline:assembly] Launching Puppeteer...`);

  // Local testing trick: if you are on Windows, @sparticuz/chromium might fail.
  // We specify executablePath dynamically based on environment if needed.
  // By default, for serverless, sparticuz works well.
  const isLocal = process.env.NODE_ENV !== 'production';

  // Make sure we have a correct executable path locally. 
  // Normally @sparticuz/chromium is meant for Lambda. Locally, you'd define the path to Chrome.
  const executablePath = isLocal && process.platform === 'win32'
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' // common local windows path
    : await chromium.executablePath();

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: executablePath || undefined,
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  
  // Set content and wait for images and fonts to load
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();

  console.log(`[ai-pipeline:assembly] Generated PDF (${pdfBuffer.length} bytes). Uploading to S3...`);

  const pdfKey = `stories/${params.storyId}/book.pdf`;

  // 4. Upload PDF to S3
  // TTL is managed by S3 bucket lifecycle rules theoretically, or we can just upload it normally.
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: pdfKey,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
  }));

  // 5. Generate Signed URL for 24h (86400 seconds)
  const getCmd = new GetObjectCommand({
    Bucket: bucket,
    Key: pdfKey,
  });

  const signedPdfUrl = await getSignedUrl(s3Client, getCmd, { expiresIn: 86400 });

  console.log(`[ai-pipeline:assembly] Story assembly complete.`);

  return {
    manifestUrl,
    pdfUrl: signedPdfUrl, // We return the signed URL because it expires and is secure, 
                          // though we might also want to store the stable unsigned S3 URL in DB. 
                          // Or we store the signed URL in DB (but it expires).
                          // Usually, it's better to store the key, but the instructions say "status=done, manifestUrl, pdfUrl".
                          // We'll return the signed URL for the client but know it expires.
  };
}
