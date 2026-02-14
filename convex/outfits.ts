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

export const saveOutfit = internalMutation({
  args: {
    userId: v.string(),
    occasion: v.string(),
    mood: v.number(),
    bodyState: v.string(),
    weatherSummary: v.string(),
    outfitText: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("outfitHistory", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const generateOutfit = action({
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

    const itemsSummary = closetItems
      .map((item) => `${item.type}: ${item.label || "unlabeled"}`)
      .join(", ");

    const prompt = `You are a fashion stylist. Based on the user's closet and context, suggest one outfit.
    Closet: ${itemsSummary}
    Context: Occasion: ${args.occasion}, Mood: ${args.mood}/100, Body State: ${args.bodyState}, Weather: ${args.weatherSummary}
    Output STRICT JSON only: { "outfitText": "Detailed outfit description", "reason": "One sentence explanation" }`;

    let outfitText = "";
    let reason = "";

    try {
      const response = await fetch("https://api.minimaxi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model: "MiniMax-M2",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      outfitText = parsed.outfitText;
      reason = parsed.reason;
    } catch (error) {
      console.error("MiniMax error:", error);
      outfitText = "A chic combination of your favorite basics.";
      reason = "Fallback suggestion due to styling service interruption.";
    }

    await ctx.runMutation(internal.outfits.saveOutfit, {
      ...args,
      outfitText,
      reason,
    });

    return { outfitText, reason };
  },
});
