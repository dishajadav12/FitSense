import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  closetItems: defineTable({
    userId: v.string(),
    imageUrl: v.string(),
    label: v.optional(v.string()),
    type: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
  userProfiles: defineTable({
    userId: v.string(),
    name: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
  outfitHistory: defineTable({
    userId: v.string(),
    occasion: v.string(),
    mood: v.number(),
    bodyState: v.string(),
    weatherSummary: v.string(),
    outfitText: v.optional(v.string()),
    reason: v.optional(v.string()),
    itemIds: v.optional(v.array(v.string())),
    results: v.optional(v.array(v.object({
      outfitText: v.string(),
      reason: v.string(),
      selectedItemIds: v.optional(v.array(v.string())),
      tryOnImageBase64: v.optional(v.any()),
    }))),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
