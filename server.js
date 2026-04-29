import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const geminiKey = process.env.GEMINI_API_KEY;
const appApiToken = process.env.APP_API_TOKEN;

if (!geminiKey) {
  console.error('Missing GEMINI_API_KEY in environment.');
  process.exit(1);
}

if (!appApiToken) {
  console.error('Missing APP_API_TOKEN in environment.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(geminiKey);

app.get('/health', (_, res) => {
  res.json({ ok: true });
});

app.post('/generate-selfie', async (req, res) => {
  try {
    const token = req.header('x-app-token');
    if (token !== appApiToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { base64Image, mimeType, prompt } = req.body;
    if (!base64Image || !prompt) {
      return res.status(400).json({ error: 'Missing base64Image or prompt' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
    const imageResult = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType || 'image/jpeg',
        },
      },
      { text: prompt },
    ]);

    const imageResponse = imageResult.response;
    let imageBase64 = null;
    let textResponse = null;

    if (imageResponse?.candidates?.length) {
      const parts = imageResponse.candidates[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.text) textResponse = part.text;
        if (part.inlineData?.data) {
          imageBase64 = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageBase64) {
      return res.status(502).json({
        error: 'Gemini did not return an image',
        textResponse,
      });
    }

    return res.json({
      imageBase64,
      textResponse,
    });
  } catch (error) {
    console.error('generate-selfie error:', error);
    return res.status(500).json({
      error: error?.message || 'Internal server error',
    });
  }
});

const port = Number(process.env.PORT) || 10000;
app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
