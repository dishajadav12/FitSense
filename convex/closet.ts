import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listClosetItems = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("closetItems")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
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
    return await ctx.db.insert("closetItems", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});
