import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const decorations = await ctx.db.query("decorations").order("asc").collect();

    // Fetch actual image URLs from storage for each decoration
    const decorationsWithUrls = await Promise.all(
      decorations.map(async (decoration) => {
        let imageUrl = decoration.imageUrl;
        if (decoration.imageId) {
          const url = await ctx.storage.getUrl(decoration.imageId);
          if (url) {
            imageUrl = url;
          }
        }
        return { ...decoration, imageUrl };
      })
    );

    return decorationsWithUrls;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    biomeId: v.optional(v.id("biomes")),
    cost: v.number(),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("decorations").collect();
    const order = existing.length;

    return await ctx.db.insert("decorations", {
      ...args,
      order,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("decorations"),
    name: v.optional(v.string()),
    biomeId: v.optional(v.id("biomes")),
    cost: v.optional(v.number()),
    description: v.optional(v.string()),
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
  args: { id: v.id("decorations") },
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
