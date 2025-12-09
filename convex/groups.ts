import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("groups").order("asc").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if we've hit the 50 group limit
    const existing = await ctx.db.query("groups").collect();
    if (existing.length >= 50) {
      throw new Error("Maximum of 50 groups allowed");
    }

    const order = existing.length;
    return await ctx.db.insert("groups", {
      name: args.name,
      color: args.color,
      order,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("groups"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
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
  args: { id: v.id("groups") },
  handler: async (ctx, args) => {
    // Remove groupId from all creatures in this group
    const creatures = await ctx.db
      .query("creatures")
      .filter((q) => q.eq(q.field("groupId"), args.id))
      .collect();

    for (const creature of creatures) {
      await ctx.db.patch(creature._id, { groupId: undefined });
    }

    await ctx.db.delete(args.id);
  },
});
