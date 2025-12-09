import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  biomes: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    order: v.number(),
  }),

  groups: defineTable({
    name: v.string(),
    color: v.optional(v.string()),
    order: v.number(),
  }),

  creatures: defineTable({
    name: v.string(),
    biomeId: v.optional(v.id("biomes")),
    groupId: v.optional(v.id("groups")),
    goldValue: v.number(),
    goldPerMinute: v.number(),
    rarity: v.union(
      v.literal("common"),
      v.literal("uncommon"),
      v.literal("rare"),
      v.literal("legendary"),
      v.literal("mythic")
    ),
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    chartCode: v.optional(v.string()), // e.g., "A1N", "K3G", "Z5C"
    order: v.number(),
  }),

  decorations: defineTable({
    name: v.string(),
    biomeId: v.optional(v.id("biomes")),
    cost: v.number(),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    order: v.number(),
  }),
});
