import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all data for backup
export const getAllData = query({
  args: {},
  handler: async (ctx) => {
    const creatures = await ctx.db.query("creatures").collect();
    const biomes = await ctx.db.query("biomes").collect();
    const decorations = await ctx.db.query("decorations").collect();
    const groups = await ctx.db.query("groups").collect();

    return {
      creatures,
      biomes,
      decorations,
      groups,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
  },
});

// Store backup in Convex (keeps last 10 backups)
export const storeBackup = mutation({
  args: {
    data: v.string(), // JSON string of backup data
  },
  handler: async (ctx, args) => {
    // Get existing backups
    const existingBackups = await ctx.db.query("backups").order("desc").collect();

    // Insert new backup
    const backupId = await ctx.db.insert("backups", {
      data: args.data,
      createdAt: Date.now(),
    });

    // Keep only last 10 backups, delete older ones
    if (existingBackups.length >= 10) {
      const toDelete = existingBackups.slice(9); // Keep first 9 (plus the new one = 10)
      for (const backup of toDelete) {
        await ctx.db.delete(backup._id);
      }
    }

    return backupId;
  },
});

// List all stored backups
export const listBackups = query({
  args: {},
  handler: async (ctx) => {
    const backups = await ctx.db.query("backups").order("desc").collect();
    return backups.map(b => ({
      _id: b._id,
      createdAt: b.createdAt,
      // Don't return the full data in the list, just metadata
      dataSize: b.data.length,
    }));
  },
});

// Get a specific backup
export const getBackup = query({
  args: { id: v.id("backups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
