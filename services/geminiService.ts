import { GoogleGenAI, Type, Schema } from "@google/genai";
import { JudgeResult } from "../types";

// --- UTILITIES ---

// Helper to convert an image URL to Base64
const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- API CALLS ---

/**
 * Generates a set of 5 funny captions for the user to hold in their hand, 
 * based loosely on the image context.
 */
export const generateUserHand = async (imageUrl: string): Promise<string[]> => {
  try {
    const base64Image = await urlToBase64(imageUrl);

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        captions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "A list of 5 funny, meme-style captions.",
        },
      },
      required: ["captions"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Analyze this image. Generate 5 distinct, hilarious, short meme captions that could fit this image. Make them sound like cards from the game 'What Do You Meme?'. They should be relatable situations or funny reactions."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 1.2, // High creativity
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed.captions || [];
    }
    return [];
  } catch (error) {
    console.error("Error generating user hand:", error);
    // Return fallback if API fails so game doesn't crash
    return ["When the code works on the first try.", "Me pretending to listen.", "Monday morning vibes.", "When you forgot to mute your mic.", "Loading personality..."];
  }
};

/**
 * Generates a single "AI Opponent" caption.
 */
export const generateAiMove = async (imageUrl: string): Promise<string> => {
  try {
    const base64Image = await urlToBase64(imageUrl);
    
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        caption: { type: Type.STRING, description: "The single funniest caption you can think of." },
      },
      required: ["caption"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image
              }
            },
            {
              text: "You are a meme master. Look at this image and write ONE incredibly funny, clever, and perfectly fitting caption. It needs to be better than a human's caption."
            }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 1, 
      }
    });

    if (response.text) {
        const parsed = JSON.parse(response.text);
        return parsed.caption || "I have no words for this.";
    }
    return "Error 404: Humor not found.";
  } catch (error) {
    console.error("Error generating AI move:", error);
    return "I am speechless.";
  }
};

/**
 * Judges the round between User and AI.
 */
export const judgeRound = async (
  imageUrl: string,
  userCaption: string,
  aiCaption: string
): Promise<JudgeResult> => {
  try {
    const base64Image = await urlToBase64(imageUrl);

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        winner: { type: Type.STRING, enum: ["user", "ai", "tie"] },
        userScore: { type: Type.INTEGER, description: "Score out of 100" },
        aiScore: { type: Type.INTEGER, description: "Score out of 100" },
        commentary: { type: Type.STRING, description: "Sarcastic or enthusiastic commentary explaining who won and why." },
        funniestCaption: { type: Type.STRING, description: "The text of the winning caption" }
      },
      required: ["winner", "userScore", "aiScore", "commentary", "funniestCaption"],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `You are the Judge of the Meme Court. 
            
            Here is the image.
            
            Contestant 1 (Human) Caption: "${userCaption}"
            Contestant 2 (AI) Caption: "${aiCaption}"
            
            Decide who is funnier based on the image context. Be strict but fair. If the human is funnier, let them win. If the AI is funnier, the AI wins.
            Provide scores and a short, witty commentary on the result.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as JudgeResult;
    }
    
    throw new Error("Empty response from judge");

  } catch (error) {
    console.error("Error judging round:", error);
    // Fallback result
    return {
        winner: 'tie',
        userScore: 50,
        aiScore: 50,
        commentary: " The judge is out to lunch. It's a draw.",
        funniestCaption: "N/A"
    };
  }
};
