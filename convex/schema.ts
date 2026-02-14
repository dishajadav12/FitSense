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
  // Keeping these for later steps as defined previously
  outfits: defineTable({
    userId: v.string(),
    topId: v.id("closetItems"),
    bottomId: v.id("closetItems"),
    shoesId: v.id("closetItems"),
    dateWorn: v.optional(v.string()),
  }),
});
