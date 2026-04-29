## AI Selfie Backend

Small Express proxy for Gemini image generation.

### Local run

1. Copy env file:
   - `cp .env.example .env`
2. Fill `GEMINI_API_KEY` and `APP_API_TOKEN` in `.env`.
3. Install and start:
   - `npm install`
   - `npm start`

Health check:
- `GET /health`

Image endpoint:
- `POST /generate-selfie`
- Headers: `x-app-token: <APP_API_TOKEN>`
- Body:
```json
{
  "base64Image": "...",
  "mimeType": "image/jpeg",
  "prompt": "..."
}
```
