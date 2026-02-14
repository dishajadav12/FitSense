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
      tryOnImageBase64: v.optional(v.string()),
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
  handler: async (ctx, args) => {
    const closetItems = await ctx.runQuery(api.closet.listClosetItems, {
      userId: args.userId,
    });
    const profilePhotoUrl = await ctx.runQuery(api.profile.getProfilePhoto, {
      userId: args.userId,
    });

    const itemsSummary = closetItems
      .map((item) => `${item.type}: ${item.label || "unlabeled"}`)
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
      const textData = await textResponse.json();
      results = JSON.parse(textData.choices[0].message.content).results;
    } catch (e) {
      console.error("Text generation failed", e);
      results = [
        { outfitText: "Casual Chic", reason: "Comfortable and stylish for everyday.", imagePrompt: "wearing casual stylish clothes" },
        { outfitText: "Evening Elegance", reason: "Sophisticated look for the night.", imagePrompt: "wearing elegant evening attire" },
        { outfitText: "Active Ease", reason: "Perfect for a busy day on the go.", imagePrompt: "wearing active wear" }
      ];
    }

    const finalResults = [];
    for (const res of results) {
      let base64 = null;
      if (profilePhotoUrl) {
        try {
          const imgResponse = await fetch("https://api.minimax.io/v1/image_generation", {
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
          const imgData = await imgResponse.json();
          base64 = imgData.base64;
        } catch (e) {
          console.error("Image generation failed", e);
        }
      }
      finalResults.push({
        outfitText: res.outfitText,
        reason: res.reason,
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
