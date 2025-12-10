import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("biomes").order("asc").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    rowNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("biomes").collect();
    const order = existing.length;

    return await ctx.db.insert("biomes", {
      ...args,
      order,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("biomes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    rowNumber: v.optional(v.number()),
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
  args: { id: v.id("biomes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
