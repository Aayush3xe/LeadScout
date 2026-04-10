// All V8 queries & mutations — scan jobs, analytics, and internal helpers
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v, ConvexError } from "convex/values";

// ─── Public: Scan Jobs ───────────────────────────────────────────────────────

export const createJob = mutation({
  args: { name: v.string(), urls: v.array(v.string()) },
  handler: async (ctx, args) => {
    if (args.urls.length === 0)
      throw new ConvexError({ message: "At least one URL is required", code: "BAD_REQUEST" });
    if (args.urls.length > 50)
      throw new ConvexError({ message: "Maximum 50 URLs per job", code: "BAD_REQUEST" });

    const jobId = await ctx.db.insert("scan_jobs", {
      name: args.name,
      status: "pending",
      urls: args.urls,
      totalUrls: args.urls.length,
      processedUrls: 0,
      createdAt: new Date().toISOString(),
    });

    for (const url of args.urls) {
      await ctx.db.insert("lead_results", { jobId, url, status: "pending" });
    }

    return jobId;
  },
});

export const listJobs = query({
  args: {},
  handler: async (ctx) => ctx.db.query("scan_jobs").order("desc").take(50),
});

export const getJob = query({
  args: { jobId: v.id("scan_jobs") },
  handler: async (ctx, args) => ctx.db.get(args.jobId),
});

export const getJobResults = query({
  args: { jobId: v.id("scan_jobs") },
  handler: async (ctx, args) =>
    ctx.db.query("lead_results").withIndex("by_job", (q) => q.eq("jobId", args.jobId)).collect(),
});

export const deleteJob = mutation({
  args: { jobId: v.id("scan_jobs") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("lead_results")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();
    for (const r of results) await ctx.db.delete(r._id);
    await ctx.db.delete(args.jobId);
  },
});

// ─── Public: Analytics ───────────────────────────────────────────────────────

export const getJobSummary = query({
  args: { jobId: v.id("scan_jobs") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("lead_results")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();

    const completed = results.filter((r) => r.status === "completed");
    const goodFits = completed.filter((r) => r.isFit === true);
    const notFits = completed.filter((r) => r.isFit === false);
    const failed = results.filter((r) => r.status === "failed");

    const avgScore =
      goodFits.length > 0
        ? Math.round(
            (goodFits.reduce((s, r) => s + (r.confidenceScore ?? 0), 0) / goodFits.length) * 10
          ) / 10
        : 0;

    return {
      total: results.length,
      completed: completed.length,
      goodFits: goodFits.length,
      notFits: notFits.length,
      failed: failed.length,
      pending: results.filter((r) => r.status === "pending").length,
      processing: results.filter((r) => r.status === "processing").length,
      avgScore,
      fitRate: completed.length > 0 ? Math.round((goodFits.length / completed.length) * 100) : 0,
      scoreBuckets: [
        { label: "Low (1-3)", count: completed.filter((r) => (r.confidenceScore ?? 0) <= 3).length },
        {
          label: "Medium (4-6)",
          count: completed.filter((r) => {
            const s = r.confidenceScore ?? 0;
            return s >= 4 && s <= 6;
          }).length,
        },
        { label: "High (7-10)", count: completed.filter((r) => (r.confidenceScore ?? 0) >= 7).length },
      ],
    };
  },
});

// ─── Internal: used by analyze.ts actions ────────────────────────────────────

export const getPendingResultsQuery = internalQuery({
  args: { jobId: v.id("scan_jobs") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("lead_results")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();
    return results.filter((r) => r.status === "pending").map((r) => ({ _id: r._id, url: r.url }));
  },
});

export const setJobRunning = internalMutation({
  args: { jobId: v.id("scan_jobs") },
  handler: async (ctx, args) => ctx.db.patch(args.jobId, { status: "running" }),
});

export const markProcessing = internalMutation({
  args: { resultId: v.id("lead_results") },
  handler: async (ctx, args) => ctx.db.patch(args.resultId, { status: "processing" }),
});

export const saveResult = internalMutation({
  args: {
    resultId: v.id("lead_results"),
    jobId: v.id("scan_jobs"),
    scrapedText: v.string(),
    businessName: v.optional(v.string()),
    isFit: v.boolean(),
    confidenceScore: v.number(),
    reasoning: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.resultId, {
      scrapedText: args.scrapedText,
      businessName: args.businessName,
      isFit: args.isFit,
      confidenceScore: args.confidenceScore,
      reasoning: args.reasoning,
      status: "completed",
      processedAt: new Date().toISOString(),
    });
    const job = await ctx.db.get(args.jobId);
    if (!job) return;
    const n = job.processedUrls + 1;
    await ctx.db.patch(args.jobId, { processedUrls: n, status: n >= job.totalUrls ? "completed" : "running" });
  },
});

export const saveError = internalMutation({
  args: {
    resultId: v.id("lead_results"),
    jobId: v.id("scan_jobs"),
    errorMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.resultId, {
      status: "failed",
      errorMessage: args.errorMessage,
      processedAt: new Date().toISOString(),
    });
    const job = await ctx.db.get(args.jobId);
    if (!job) return;
    const n = job.processedUrls + 1;
    await ctx.db.patch(args.jobId, { processedUrls: n, status: n >= job.totalUrls ? "completed" : "running" });
  },
});
