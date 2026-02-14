import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const listHistory = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("outfitHistory")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5);
  },
});

export const saveOutfitHistory = internalMutation({
  args: {
    userId: v.string(),
    occasion: v.string(),
    mood: v.number(),
    bodyState: v.string(),
    weatherSummary: v.string(),
    results: v.array(v.object({
      outfitText: v.string(),
      reason: v.string(),
      selectedItemIds: v.optional(v.array(v.string())),
      tryOnImageBase64: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("outfitHistory", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const generateTop3OutfitsWithTryOn = action({
  args: {
    userId: v.string(),
    occasion: v.string(),
    mood: v.number(),
    bodyState: v.string(),
    weatherSummary: v.string(),
    itemDescriptions: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    const closetItems = await ctx.runQuery(api.closet.listClosetItems, {
      userId: args.userId,
    });
    const profilePhotoUrl = await ctx.runQuery(api.profile.getProfilePhoto, {
      userId: args.userId,
    });

    if (!closetItems || closetItems.length === 0) {
      throw new Error("Your closet is empty. Add some items first!");
    }

    const descriptions: Record<string, string> = args.itemDescriptions || {};

    const itemCatalog = closetItems.map((item: any, idx: number) => ({
      id: item._id,
      index: idx,
      type: item.type || "unknown",
      label: item.label || "unlabeled item",
      imageUrl: item.imageUrl,
      visualDescription: descriptions[item._id] || null,
    }));

    const catalogText = itemCatalog
      .map((item: any) => {
        const desc = item.visualDescription
          ? `\n   Visual Analysis: ${item.visualDescription}`
          : "";
        return `ID:"${item.id}" | Type:${item.type} | Label:"${item.label}"${desc}`;
      })
      .join("\n\n");

    const hasDescriptions = Object.keys(descriptions).length > 0;

    const textPrompt = `You are a professional women's fashion stylist. You have access to the user's ENTIRE wardrobe below.${hasDescriptions ? " Each item includes a detailed visual analysis from AI image recognition — use these descriptions to make informed color, pattern, and style matching decisions." : ""} Your job is to create 3 complete, wearable outfits using ONLY items from this wardrobe.

WARDROBE INVENTORY:
${catalogText}

STYLING CONTEXT:
- Occasion: ${args.occasion}
- Mood level: ${args.mood}/100 (0=minimal/subdued, 100=bold/expressive)
- Body state: ${args.bodyState}
- Weather: ${args.weatherSummary}

RULES:
1. Each outfit MUST use only items listed above — reference them by their exact ID
2. Each outfit should include a logical combination (e.g. top+bottom+shoes, or dress+shoes+outerwear)
3. Do NOT reuse the same item across multiple outfits unless necessary
4. Consider the occasion, weather, mood, and body state when selecting items
5.${hasDescriptions ? " Use the visual analysis descriptions to ensure colors complement each other, patterns don't clash, and the overall aesthetic is cohesive." : ""} Provide a short outfit name, the reason it works, and a detailed visual description of the complete look
6. In the imagePrompt, describe EXACTLY what the selected garments look like based on their visual analysis — accurate colors, fabrics, and details

Output STRICT JSON only:
{
  "results": [
    {
      "outfitText": "Short creative outfit name",
      "reason": "Why this combination works for the context — reference specific colors, patterns, or fabric pairings",
      "selectedItemIds": ["id1", "id2", "id3"],
      "imagePrompt": "Detailed description of a woman wearing: [describe each selected garment precisely using the visual analysis — its exact color, fabric texture, fit, style details]. Full-body, front-facing, fashion editorial pose"
    }
  ]
}`;

    let results: any[] = [];
    try {
      const textResponse = await fetch("https://api.minimax.io/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model: "MiniMax-M2",
          messages: [{ role: "user", content: textPrompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (!textResponse.ok) {
        const errorText = await textResponse.text();
        throw new Error(`MiniMax Text API Error: ${textResponse.status} - ${errorText}`);
      }

      const textData: any = await textResponse.json();

      if (textData.choices && textData.choices[0] && textData.choices[0].message) {
        let content = textData.choices[0].message.content;
        content = content.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error(`No JSON found in response: ${content.substring(0, 200)}`);
        const parsed = JSON.parse(jsonMatch[0]);
        results = parsed.results || parsed.outfits || [];
      } else {
        throw new Error(`Invalid MiniMax response structure: ${JSON.stringify(textData)}`);
      }
    } catch (e) {
      console.error("Text generation error:", e);
      throw e;
    }

    const validItemIds = new Set(itemCatalog.map((i: any) => i.id));
    const itemsByType: Record<string, any[]> = {};
    for (const item of itemCatalog) {
      if (!itemsByType[item.type]) itemsByType[item.type] = [];
      itemsByType[item.type].push(item);
    }

    const usedIds = new Set<string>();
    const finalResults = [];
    for (const res of results) {
      let selectedIds = (res.selectedItemIds || []).filter((id: string) => validItemIds.has(id));

      if (selectedIds.length === 0) {
        const fallback: string[] = [];
        for (const t of ["top", "bottom", "shoes", "dress", "outerwear"]) {
          const available = (itemsByType[t] || []).filter((i: any) => !usedIds.has(i.id));
          if (available.length > 0) {
            fallback.push(available[0].id);
            usedIds.add(available[0].id);
          }
          if (fallback.length >= 3) break;
        }
        selectedIds = fallback;
      }
      selectedIds.forEach((id: string) => usedIds.add(id));

      let base64 = undefined;
      if (profilePhotoUrl && res.imagePrompt) {
        try {
          const imgResponse: any = await fetch("https://api.minimax.io/v1/image_generation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
            },
            body: JSON.stringify({
              model: "image-01",
              prompt: `${res.imagePrompt}, photorealistic, full-body, front view, neutral studio background, fashion photography, accurate clothing textures and colors`,
              aspect_ratio: "3:4",
              subject_reference: [{ type: "character", image_file: profilePhotoUrl }],
              response_format: "base64",
            }),
          });

          if (!imgResponse.ok) {
            const errorText = await imgResponse.text();
            console.error(`Image API Error: ${imgResponse.status} - ${errorText}`);
          } else {
            const imgData: any = await imgResponse.json();
            if (imgData.data?.image_base64?.[0]) {
              base64 = imgData.data.image_base64[0];
            } else if (imgData.base64) {
              base64 = imgData.base64;
            }
          }
        } catch (e) {
          console.error("Image generation error:", e);
        }
      }

      finalResults.push({
        outfitText: res.outfitText || "Stylish Look",
        reason: res.reason || "A great combination from your wardrobe.",
        selectedItemIds: selectedIds,
        tryOnImageBase64: base64,
      });
    }

    await ctx.runMutation(internal.outfits.saveOutfitHistory, {
      userId: args.userId,
      occasion: args.occasion,
      mood: args.mood,
      bodyState: args.bodyState,
      weatherSummary: args.weatherSummary,
      results: finalResults,
    });

    return finalResults;
  },
});
