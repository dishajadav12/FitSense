import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertProfilePhoto = mutation({
  args: { userId: v.string(), photoUrl: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        photoUrl: args.photoUrl,
        createdAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        photoUrl: args.photoUrl,
        createdAt: Date.now(),
      });
    }
  },
});

export const getProfilePhoto = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    return profile?.photoUrl || null;
  },
});
