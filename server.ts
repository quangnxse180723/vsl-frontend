/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Dynamic Gemini Client Lazy-Loader
  function getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
       return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API Endpoint: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', api_key_present: !!process.env.GEMINI_API_KEY });
  });

  // API Endpoint: Check webcam hand-sign using Gemini API
  app.post('/api/evaluate-sign', async (req, res) => {
    try {
      const { image, target } = req.body;

      if (!image) {
        return res.status(400).json({ error: 'Missing snapshot image' });
      }
      if (!target) {
        return res.status(400).json({ error: 'Missing target ASL sign name' });
      }

      // Extract binary data from Base64
      let base64Data = '';
      let mimeType = 'image/jpeg';
      if (image.includes(',')) {
        const parts = image.split(',');
        base64Data = parts[1];
        const match = parts[0].match(/data:(.*?);/);
        if (match) {
          mimeType = match[1];
        }
      } else {
        base64Data = image;
      }

      const client = getGenAI();

      if (!client) {
        // High fidelity fallback simulation when key is not defined, to ensure seamless preview
        console.log(`[API Proxy] Gemini API Key not present. Simulating ASL analysis feedback for target: ${target}`);
        
        // Let's create realistic variations based on the target sign so the experience remains highly educational!
        const fallbacks: Record<string, any> = {
          'A': {
            score: 87,
            matched: true,
            feedback: "Perfect closed-fist shape! Your index, middle, ring, and pinky fingers are tucked flat. Excellent positioning.",
            suggestion: "For an absolute 100%, try raising your thumb just 5 degrees more vertically against the side of your index knuckle."
          },
          'Hello': {
            score: 92,
            matched: true,
            feedback: "Nice hand height and wrist alignment at the side of your head. Your palm direction looks very welcoming.",
            suggestion: "Complete the salute gesture smoothly by sliding your hand slightly out and away in a polite transition, palm facing down."
          },
          '3': {
            score: 78,
            matched: true,
            feedback: "Good finger isolation. The thumb, index, and middle fingers are correctly extended.",
            suggestion: "You did well, but make sure your ring and pinky fingers are folded more tightly against your palm so they aren't confused with number 5."
          },
          'Father': {
            score: 84,
            matched: true,
            feedback: "Accurate forehead contact spot! The '5'-handshape has fingers spread evenly, which matches the masculine marker area.",
            suggestion: "Remember to double-tap your forehead lightly rather than keeping your thumb static for standard conversational sign flow."
          },
          'Water': {
            score: 81,
            matched: true,
            feedback: "Your index, middle, and ring fingers are raised correctly to form the classic 'W' lettershape.",
            suggestion: "Tap the side of your index finger twice specifically on the center of your chin to convey the concept cleanly."
          },
          'Y': {
            score: 90,
            matched: true,
            feedback: "Stellar performance! Thumb and pinky are fully elongated with middle fingers tucked securely down.",
            suggestion: "Keep your wrist stable at shoulder-height without bouncing to maximize visibility for distant viewers."
          }
        };

        const targetKey = String(target);
        const result = fallbacks[targetKey] || {
          score: Math.floor(Math.random() * 21) + 75, // random score between 75 and 95
          matched: true,
          feedback: `Good attempt with target "${target}" ! Hand size and height are aligned well inside matching parameters.`,
          suggestion: "Try locking your fingers into position and ensuring professional contrast with your clothing."
        };

        // Add a signature indicating fallback
        return res.json({
          ...result,
          isSimulation: true,
          message: "Using intelligent sign parser (Simulated - set GEMINI_API_KEY in panel for real Vision scoring)"
        });
      }

      console.log(`[API Proxy] Querying Gemini model for ASL sign analysis for target: ${target}`);

      // Query Gemini!
      const systemPrompt = `You are a professional, friendly American Sign Language (ASL) instructor checking a student's webcam photo. 
Analyze if their hand sign posture matches the target sign: "${target}".
You must return a raw JSON response. Focus on finger extensions, foldings, palm orientation, and overall posture. 
Provide brief constructive feedback and detailed suggestions for correction if something is off.
Ensure the response complies with the JSON schema described below. Do not output anything outside the JSON structure.

JSON Response Schema:
{
  "score": number, // a score from 0 to 100 representing how close they are
  "matched": boolean, // true if the gesture aligns with "${target}" conceptually, false otherwise
  "feedback": "string", // Positive encouragement and precise hand structure analysis
  "suggestion": "string" // Practical correction advice (e.g., finger spacing, wrist position, palm angle)
}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            text: `Evaluate this visual snapshot against the target ASL sign: "${target}". Tell me if it matches, grade it, and analyze hand posture.`,
          },
          {
            inlineData: {
              data: base64Data,
              mimeType,
            }
          }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              matched: { type: Type.BOOLEAN },
              feedback: { type: Type.STRING },
              suggestion: { type: Type.STRING }
            },
            required: ['score', 'matched', 'feedback', 'suggestion']
          }
        }
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText.trim());

      return res.json({
        ...parsedData,
        isSimulation: false
      });

    } catch (error: any) {
      console.error('[API Proxy Error]', error);
      return res.status(500).json({ 
        error: 'Evaluation failed', 
        details: error.message,
        isSimulation: true,
        score: 65,
        matched: false,
        feedback: "We couldn't analyze this cleanly. Ensure your camera is well-lit and your hand is fully in frame.",
        suggestion: "Try holding your hand 12 inches from the lens with a solid neutral background."
      });
    }
  });

  // Vite Integration for Dev mode / Static express serving for Prod
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SignMentor Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('[SignMentor Shutdown] Initialization failed:', err);
});
