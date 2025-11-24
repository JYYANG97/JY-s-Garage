import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeCADFile = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze this technical drawing or CAD file. 
            1. Identify the object type.
            2. Extract any visible dimensions (height, width, step count, tube diameter).
            3. Identify materials if specified or visually apparent.
            4. Describe the key mechanism (e.g., folding, rigid, telescopic).
            Return a concise summary suitable for a technical specification.`,
          },
        ],
      },
    });

    return response.text || "Analysis failed to produce text.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the file.");
  }
};

export const generateDesignConcept = async (
  prompt: string, 
  analysisContext: string,
  originalFile?: { data: string, mimeType: string }
): Promise<string> => {
  try {
    const parts: any[] = [];

    // If we have an original image, we use it as a reference for the generation
    // Note: gemini-2.5-flash-image typically accepts images. If it's a PDF, 
    // we rely heavily on the analysisContext text description unless we rasterize it.
    // For this implementation, we will pass the image if it is an image type.
    if (originalFile && originalFile.mimeType.startsWith('image/')) {
      parts.push({
        inlineData: {
          mimeType: originalFile.mimeType,
          data: originalFile.data
        }
      });
    }

    // Construct a rich prompt
    const fullPrompt = `
      Task: Create a technical visualization (3D isometric view or detailed 2D view) of a redesigned industrial object.
      
      Original Design Analysis: ${analysisContext}
      
      Modification Orders: ${prompt}
      
      Requirements:
      - Maintain the professional style of a technical drawing or CAD render.
      - Contrast with the original by strictly following the modification orders.
      - White background, clean lines, realistic shadowing.
      - Ensure dimensions look proportional to the request.
    `;

    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    // Extract the image from the response
    let imageUrl = '';
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image data found in response");
    }

    return imageUrl;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
