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
  },
  handler: async (ctx, args): Promise<any[]> => {
    const closetItems = await ctx.runQuery(api.closet.listClosetItems, {
      userId: args.userId,
    });
    const profilePhotoUrlData = await ctx.runQuery(api.profile.getProfilePhoto, {
      userId: args.userId,
    });
    const profilePhotoUrl = profilePhotoUrlData;

    const itemsSummary = closetItems
      .map((item: any) => `${item.type}: ${item.label || "unlabeled"}`)
      .join(", ");

    const textPrompt = `You are a fashion stylist. Based on the user's closet and context, suggest exactly 3 outfits.
    Closet: ${itemsSummary}
    Context: Occasion: ${args.occasion}, Mood: ${args.mood}/100, Body State: ${args.bodyState}, Weather: ${args.weatherSummary}
    Output STRICT JSON only: { "results": [ { "outfitText": "...", "reason": "...", "imagePrompt": "short photorealistic description of user wearing the outfit" } ] }`;

    let results: any[] = [];
    try {
      const textResponse = await fetch("https://api.minimaxi.com/v1/chat/completions", {
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
        const content = textData.choices[0].message.content;
        const parsed = JSON.parse(content);
        results = parsed.results || parsed.outfits || [];
      } else {
        throw new Error(`Invalid MiniMax response structure: ${JSON.stringify(textData)}`);
      }
    } catch (e) {
      console.error("Text generation error details:", e);
      throw e; // Stop execution if text generation fails
    }

    const finalResults = [];
    for (const res of results) {
      let base64 = undefined;
      if (profilePhotoUrl) {
        try {
          const imgResponse: any = await fetch("https://api.minimax.io/v1/image_generation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
            },
            body: JSON.stringify({
              model: "image-01",
              prompt: `${res.imagePrompt}, photorealistic, full-body, front view, neutral studio background, fashion photography, accurate clothing textures`,
              aspect_ratio: "3:4",
              subject_reference: [{ type: "character", image_file: profilePhotoUrl }],
              response_format: "base64",
            }),
          });

          if (!imgResponse.ok) {
            const errorText = await imgResponse.text();
            throw new Error(`MiniMax Image API Error: ${imgResponse.status} - ${errorText}`);
          }

          const imgData: any = await imgResponse.json();
          base64 = imgData.base64 || undefined;
          
          if (!base64) {
            console.warn("MiniMax image generated but no base64 data returned", imgData);
          }
        } catch (e) {
          console.error("Image generation error details:", e);
        }
      }
      finalResults.push({
        outfitText: res.outfitText || "Stylish Look",
        reason: res.reason || "Suggested based on your style and context.",
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
