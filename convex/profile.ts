import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertProfile = mutation({
  args: { userId: v.string(), name: v.optional(v.string()), photoUrl: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      const updates: any = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.photoUrl !== undefined) updates.photoUrl = args.photoUrl;
      await ctx.db.patch(existing._id, updates);
    } else {
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        name: args.name,
        photoUrl: args.photoUrl,
        createdAt: Date.now(),
      });
    }
  },
});

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

export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) return null;

    let photoUrl = profile.photoUrl || null;
    if (photoUrl && !photoUrl.startsWith("http")) {
      photoUrl = await ctx.storage.getUrl(photoUrl as any);
    }

    return {
      name: profile.name || null,
      photoUrl,
    };
  },
});

export const getProfilePhoto = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile || !profile.photoUrl) return null;

    if (!profile.photoUrl.startsWith("http")) {
      return await ctx.storage.getUrl(profile.photoUrl as any);
    }

    return profile.photoUrl;
  },
});

export const getUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
