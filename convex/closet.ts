import { mutation, query } from "./_generated/server";
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
    createdAt: v.optional(v.number()), // Support both
  },
  handler: async (ctx, args) => {
    const { userId, imageUrl, label, type } = args;
    return await ctx.db.insert("closetItems", {
      userId,
      imageUrl,
      label,
      type,
      createdAt: args.createdAt ?? Date.now(),
    });
  },
});

export const updateClosetItemImage = mutation({
  args: { userId: v.string(), label: v.string(), newImageUrl: v.string() },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("closetItems")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const match = items.find((i) => i.label === args.label);
    if (match) {
      await ctx.db.patch(match._id, { imageUrl: args.newImageUrl });
      return { updated: true, id: match._id };
    }
    return { updated: false };
  },
});

export const deduplicateAndKeepLatest = mutation({
  args: { userId: v.string(), keepCount: v.number() },
  handler: async (ctx, args) => {
    const allItems = await ctx.db
      .query("closetItems")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const seen = new Set<string>();
    const toKeep: typeof allItems = [];
    const toDelete: typeof allItems = [];

    for (const item of allItems) {
      const key = `${item.imageUrl}||${item.label}||${item.type}`;
      if (seen.has(key)) {
        toDelete.push(item);
      } else {
        seen.add(key);
        toKeep.push(item);
      }
    }

    const extraToDelete = toKeep.slice(args.keepCount);
    const allToDelete = [...toDelete, ...extraToDelete];

    for (const item of allToDelete) {
      await ctx.db.delete(item._id);
    }

    return { deleted: allToDelete.length, remaining: Math.min(toKeep.length, args.keepCount) };
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
