import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  closetItems: defineTable({
    userId: v.string(),
    imageUrl: v.string(),
    label: v.optional(v.string()),
    type: v.optional(v.string()), // "top", "bottom", "dress", "shoes", "outerwear"
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
  outfits: defineTable({
    userId: v.string(),
    topId: v.id("closetItems"),
    bottomId: v.id("closetItems"),
    shoesId: v.id("closetItems"),
    dateWorn: v.optional(v.string()),
  }),
  outfitHistory: defineTable({
    userId: v.string(),
    occasion: v.string(),
    mood: v.number(),
    bodyState: v.string(),
    weatherSummary: v.string(),
    outfitText: v.string(),
    reason: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),
});
