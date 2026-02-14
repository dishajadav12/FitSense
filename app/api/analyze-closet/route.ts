import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

async function analyzeImage(imageUrl: string, itemType: string, itemLabel: string): Promise<string> {
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return `${itemType}: ${itemLabel}`;
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: contentType,
                data: base64Image,
              },
            },
            {
              text: `You are a fashion expert. Analyze this clothing item photo and provide a detailed description in ONE paragraph. Include:
- Garment type (e.g. blouse, jeans, sneakers, midi dress)
- Primary and secondary colors
- Pattern or print (solid, striped, floral, plaid, etc.)
- Fabric/material appearance (cotton, silk, denim, leather, knit, etc.)
- Fit and silhouette (oversized, fitted, A-line, slim, relaxed, etc.)
- Notable details (buttons, ruffles, pockets, embroidery, collar style, neckline, etc.)
- Style category (casual, formal, streetwear, bohemian, sporty, elegant, etc.)
- Season suitability (summer, winter, transitional, all-season)

Be specific and descriptive. This description will be used by another AI to create outfit combinations, so accuracy matters. Keep it to 2-3 sentences max.`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 8192 },
    });

    const text = response.text || "";
    return text.trim() || `${itemType}: ${itemLabel}`;
  } catch (error) {
    console.error(`Error analyzing image for ${itemLabel}:`, error);
    return `${itemType}: ${itemLabel}`;
  }
}

export async function POST(request: Request) {
  try {
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const batchSize = 3;
    const descriptions: Record<string, string> = {};

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((item: { id: string; imageUrl: string; type: string; label: string }) =>
          analyzeImage(item.imageUrl, item.type, item.label).then((desc) => ({
            id: item.id,
            description: desc,
          }))
        )
      );
      for (const r of results) {
        descriptions[r.id] = r.description;
      }
    }

    return NextResponse.json({ descriptions });
  } catch (error) {
    console.error("Error in analyze-closet:", error);
    return NextResponse.json(
      { error: "Failed to analyze closet images" },
      { status: 500 }
    );
  }
}
