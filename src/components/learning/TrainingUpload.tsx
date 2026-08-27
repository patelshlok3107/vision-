"use client";

import { useState } from "react";
import { learningApi } from "@/lib/learning";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function TrainingUpload() {
    const [prompt, setPrompt] = useState("");
    const [answer, setAnswer] = useState("");
    const [category, setCategory] = useState("coding");

    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<{ id: string; summary: string } | null>(null);

    const handlePreview = async () => {
        if (!prompt.trim() || !answer.trim()) {
            toast.error("Both Prompt and Answer are required.");
            return;
        }

        setLoading(true);
        try {
            const res = await learningApi.uploadTrainingExample({ prompt, answer, category });
            setPreview({ id: res.id, summary: res.preview_summary });
            toast.success("Preview generated successfully.");
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to generate preview.");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!preview) return;
        setLoading(true);
        try {
            await learningApi.approveTrainingExample(preview.id);
            toast.success("Training example approved and added to Knowledge Base.");
            setPrompt("");
            setAnswer("");
            setPreview(null);
        } catch (e) {
            toast.error("Failed to approve example.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mt-8">
            <h2 className="text-lg text-white font-medium mb-6 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-400" />
                Manual Admin Training
            </h2>
            <p className="text-white/50 text-sm mb-6">
                Explicitly inject high-quality Prompt/Answer pairs into VISION's knowledge base.
                This is treated as high-authority (Score 90+) and circumvents the scheduled RSS feed limit.
            </p>

            <div className="space-y-5">
                <div>
                    <label className="block text-xs uppercase text-white/50 mb-2">Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white text-sm outline-none focus:border-indigo-500/50 transition-colors"
                    >
                        <option value="coding">Coding / Programming</option>
                        <option value="architecture">System Architecture</option>
                        <option value="security">Security</option>
                        <option value="ai_ml">AI & ML</option>
                        <option value="technology">General Tech</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs uppercase text-white/50 mb-2">Prompt / Question</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. Write a React component for a glassmorphic login form..."
                        className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase text-white/50 mb-2">Target Vision Answer</label>
                    <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="e.g. Here is the implementation using TailwindCSS..."
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm outline-none focus:border-indigo-500/50 transition-colors font-mono"
                    />
                </div>

                {preview ? (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                        <h3 className="text-indigo-300 text-sm font-medium mb-1">Generated Summary for Embedding</h3>
                        <p className="text-white/70 text-sm italic mb-4">{preview.summary}</p>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleApprove}
                                disabled={loading}
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Approve & Add to KB
                            </button>
                            <button
                                onClick={() => setPreview(null)}
                                disabled={loading}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handlePreview}
                        disabled={loading || !prompt || !answer}
                        className="px-5 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                    >
                        {loading ? "Processing..." : "Generate Preview"}
                    </button>
                )}
            </div>
        </div>
    );
}
