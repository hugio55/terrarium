import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const creatures = await ctx.db.query("creatures").order("asc").collect();

    // Fetch actual image URLs from storage for each creature
    const creaturesWithUrls = await Promise.all(
      creatures.map(async (creature) => {
        let imageUrl = creature.imageUrl;
        if (creature.imageId) {
          console.log(`[CREATURES] Fetching URL for imageId: ${creature.imageId}`);
          const url = await ctx.storage.getUrl(creature.imageId);
          console.log(`[CREATURES] Got URL: ${url}`);
          if (url) {
            imageUrl = url;
          }
        }
        return { ...creature, imageUrl };
      })
    );

    return creaturesWithUrls;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    biomeId: v.optional(v.id("biomes")),
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("creatures").collect();
    const order = existing.length;

    return await ctx.db.insert("creatures", {
      ...args,
      order,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("creatures"),
    name: v.optional(v.string()),
    biomeId: v.optional(v.id("biomes")),
    goldValue: v.optional(v.number()),
    goldPerMinute: v.optional(v.number()),
    rarity: v.optional(
      v.union(
        v.literal("common"),
        v.literal("uncommon"),
        v.literal("rare"),
        v.literal("legendary"),
        v.literal("mythic")
      )
    ),
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("creatures") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Debug query to see raw data
export const debug = query({
  args: {},
  handler: async (ctx) => {
    const creatures = await ctx.db.query("creatures").collect();
    return creatures.map(c => ({
      name: c.name,
      imageId: c.imageId,
      imageIdType: typeof c.imageId,
      hasImageId: !!c.imageId,
    }));
  },
});
