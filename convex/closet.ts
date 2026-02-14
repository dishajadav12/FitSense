import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listClosetItems = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("closetItems")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return Promise.all(
      items.map(async (item) => ({
        ...item,
        imageUrl: (item.imageUrl.startsWith("https://") || item.imageUrl.startsWith("http://"))
          ? item.imageUrl
          : await ctx.storage.getUrl(item.imageUrl as any),
      }))
    );
  },
});

export const addClosetItem = mutation({
  args: {
    userId: v.string(),
    imageUrl: v.string(),
    label: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, imageUrl, label, type } = args;
    return await ctx.db.insert("closetItems", {
      userId,
      imageUrl,
      label,
      type,
      createdAt: Date.now(),
    });
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
