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
    itemIds: v.optional(v.array(v.string())),
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
      .map((item) => `[ID: ${item._id}] type: ${item.type}, label: ${item.label || "unlabeled"}`)
      .join("\n");

    const prompt = `You are a fashion stylist. Based on the user's closet and context, suggest one outfit.
    You MUST select exactly 2-3 items from the closet below by their ID.
    
    Closet Items:
    ${itemsSummary}
    
    Context: 
    Occasion: ${args.occasion}
    Mood: ${args.mood}/100 (0=Comfy, 100=Confident)
    Body State: ${args.bodyState}
    Weather: ${args.weatherSummary}
    
    Output STRICT JSON only: 
    { 
      "outfitText": "Short catchy name for the look", 
      "reason": "One sentence style explanation",
      "selectedItemIds": ["id1", "id2"] 
    }`;

    let outfitText = "";
    let reason = "";
    let selectedItemIds: string[] = [];

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

      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      outfitText = parsed.outfitText;
      reason = parsed.reason;
      selectedItemIds = parsed.selectedItemIds || [];
    } catch (error) {
      console.error("MiniMax error:", error);
      // Smart Fallback: Pick first 2 items if API fails
      outfitText = "Chic Minimalist Essentials";
      reason = "A reliable and stylish combination selected from your boutique favorites.";
      selectedItemIds = closetItems.slice(0, 2).map(i => i._id);
    }

    await ctx.runMutation(internal.outfits.saveOutfit, {
      ...args,
      outfitText,
      reason,
      itemIds: selectedItemIds,
    });

    return { outfitText, reason, selectedItemIds };
  },
});
