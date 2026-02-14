import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("closet").collect();
  },
});

export const add = mutation({
  args: { imageUrl: v.string(), type: v.string(), tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    // In a real app, use ctx.auth.getUserIdentity()
    const userId = "placeholder_user"; 
    await ctx.db.insert("closet", { userId, ...args });
  },
});
