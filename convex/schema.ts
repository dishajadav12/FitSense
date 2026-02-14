import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  closet: defineTable({
    userId: v.string(),
    imageUrl: v.string(),
    type: v.string(), // "top", "bottom", "shoes", etc.
    tags: v.array(v.string()),
  }),
  outfits: defineTable({
    userId: v.string(),
    topId: v.id("closet"),
    bottomId: v.id("closet"),
    shoesId: v.id("closet"),
    dateWorn: v.optional(v.string()),
  }),
});
