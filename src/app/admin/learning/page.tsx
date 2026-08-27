"use client";

import { useEffect, useState } from "react";
import { learningApi } from "@/lib/learning";
import {
    BrainCircuit, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck,
    TrendingDown, TrendingUp, Settings2, Clock, Check, FileText
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import TrainingUpload from "@/components/learning/TrainingUpload";

export default function LearningDashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [settingsOpt, setSettingsOpt] = useState<{
        enabled: boolean;
        auto_approve: boolean;
        reject_on_benchmark_regression: boolean;
    } | null>(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const data = await learningApi.getDashboardStats();
            setStats(data);
            const sData = await learningApi.getSettings();
            setSettingsOpt({
                enabled: sData.enabled,
                auto_approve: sData.auto_approve,
                reject_on_benchmark_regression: sData.reject_on_benchmark_regression,
            });
        } catch (e: any) {
            toast.error("Failed to load learning stats.");
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerRun = async () => {
        setTriggering(true);
        try {
            await learningApi.triggerLearningRun();
            toast.success("Learning pipeline triggered. This may take a few minutes.");
            // Soft loop to fetch updates
            setTimeout(fetchDashboard, 15000);
        } catch (e: any) {
            toast.error("Failed to trigger run.");
        } finally {
            setTriggering(false);
        }
    };

    const handleToggleSettings = async (key: keyof typeof settingsOpt) => {
        if (!settingsOpt) return;
        const newVal = !settingsOpt[key];
        setSettingsOpt({ ...settingsOpt, [key]: newVal });
        try {
            await learningApi.updateSettings({ [key]: newVal });
            toast.success("Settings updated.");
        } catch (e) {
            toast.error("Failed to update setting.");
            setSettingsOpt({ ...settingsOpt, [key]: !newVal });
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center h-full">
                <RefreshCw className="w-8 h-8 animate-spin text-white/50" />
            </div>
        );
    }

    const { last_run, latest_benchmark, category_breakdown } = stats;
    const isRunning = last_run?.status === "running";

    return (
        <div className="max-w-6xl mx-auto w-full p-8 space-y-10 animate-fade-in-up pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8 text-indigo-400" />
                        Continuous Learning Pipeline
                    </h1>
                    <p className="text-white/60 mt-1">
                        Local-first, quality-driven capability scaling for VISION.
                    </p>
                </div>
                <button
                    onClick={handleTriggerRun}
                    disabled={triggering || isRunning}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/15 active:scale-95 transition-all text-white rounded-md inline-flex items-center gap-2 border border-white/10 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${isRunning || triggering ? 'animate-spin' : ''}`} />
                    {isRunning ? "Pipeline Running..." : "Trigger Manual Run"}
                </button>
            </div>

            {/* Main KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KpiCard
                    label="Total Knowledge Items"
                    value={stats.total_knowledge_items.toString()}
                    icon={<BrainCircuit className="w-5 h-5 text-indigo-400" />}
                />
                <KpiCard
                    label="Active & Verified"
                    value={stats.active_items.toString()}
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                />
                <KpiCard
                    label="Pending Review"
                    value={stats.pending_items.toString()}
                    icon={<Clock className="w-5 h-5 text-amber-400" />}
                />
                <KpiCard
                    label="Unread Alerts"
                    value={stats.unread_notifications.toString()}
                    icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Last Run & Benchmark */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Last Run Stats */}
                    <section className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-30 opacity-5 inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />

                        <h2 className="text-lg text-white font-medium mb-6 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Last Run Diagnostics
                        </h2>

                        {last_run ? (
                            <div>
                                <div className="flex items-center gap-2 text-sm text-white/50 mb-6 font-mono">
                                    <span>{new Date(last_run.started_at).toLocaleString()}</span>
                                    <span>•</span>
                                    <span>{last_run.duration_seconds}s latency</span>
                                    <span>•</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${last_run.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                        {last_run.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t border-white/5 pt-6">
                                    <div>
                                        <div className="text-3xl font-light text-white">{last_run.documents_fetched}</div>
                                        <div className="text-xs text-white/50 uppercase mt-1">Fetched docs</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-light text-emerald-400">{last_run.items_added}</div>
                                        <div className="text-xs text-white/50 uppercase mt-1">Items Accepted</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-light text-rose-400">{last_run.items_rejected}</div>
                                        <div className="text-xs text-white/50 uppercase mt-1">Low Quality</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-light text-indigo-400">{last_run.duplicates_skipped}</div>
                                        <div className="text-xs text-white/50 uppercase mt-1">Deduped</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-white/50 text-sm">No run history.</p>
                        )}
                    </section>

                    {/* Benchmark Scorecard */}
                    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg text-white font-medium flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" />
                                Regression Benchmark
                            </h2>
                            {latest_benchmark && (
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-light text-white">{latest_benchmark.overall}<span className="text-lg text-white/50">/100</span></span>
                                </div>
                            )}
                        </div>

                        {latest_benchmark && latest_benchmark.categories ? (
                            <div className="space-y-5">
                                {Object.entries(latest_benchmark.categories).map(([cat, score]: [string, any]) => (
                                    <div key={cat}>
                                        <div className="flex justify-between text-xs text-white/60 mb-2 uppercase">
                                            <span>{cat}</span>
                                            <span>{score}/100</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${score > 80 ? 'bg-emerald-400' : score > 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                                style={{ width: `${score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-white/50 text-sm">No benchmark has been run yet.</p>
                        )}
                    </section>

                </div>

                {/* Right Column: Settings & Distribution */}
                <div className="space-y-8">

                    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg text-white font-medium mb-6 flex items-center gap-2">
                            <Settings2 className="w-5 h-5" />
                            Pipeline Controls
                        </h2>
                        <div className="space-y-4">
                            {settingsOpt && (
                                <>
                                    <ToggleSwitch
                                        label="Autopilot Schedule"
                                        desc="Run automatically every day"
                                        checked={settingsOpt.enabled}
                                        onChange={() => handleToggleSettings("enabled")}
                                    />
                                    <ToggleSwitch
                                        label="Auto Approve High-Quality"
                                        desc="Bypass manual review for score > 85"
                                        checked={settingsOpt.auto_approve}
                                        onChange={() => handleToggleSettings("auto_approve")}
                                    />
                                    <ToggleSwitch
                                        label="Strict Regression Guard"
                                        desc="Rollback items if benchmark drops > 5%"
                                        checked={settingsOpt.reject_on_benchmark_regression}
                                        onChange={() => handleToggleSettings("reject_on_benchmark_regression")}
                                    />
                                </>
                            )}
                        </div>
                    </section>

                    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg text-white font-medium mb-6">Topic Distribution</h2>
                        {category_breakdown && Object.keys(category_breakdown).length > 0 ? (
                            <div className="space-y-4">
                                {Object.entries(category_breakdown).map(([cat, count]: [string, any]) => (
                                    <div key={cat} className="flex items-center justify-between text-sm">
                                        <span className="text-white capitalize">{cat.replace("_", " ")}</span>
                                        <span className="text-white/50 bg-white/10 px-2 py-0.5 rounded-md font-mono">{count} items</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-white/50">Not enough data.</p>
                        )}
                    </section>

                    <TrainingUpload />

                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Subcomponents
// ----------------------------------------------------------------------

function KpiCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-white/60 mb-4">
                <span className="text-sm font-medium">{label}</span>
                {icon}
            </div>
            <div className="text-3xl font-light text-white tracking-tight">{value}</div>
        </div>
    );
}

function ToggleSwitch({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: () => void }) {
    return (
        <div className="flex items-start justify-between py-2 border-b border-white/5 last:border-0 cursor-pointer" onClick={onChange}>
            <div className="pr-4">
                <p className="text-sm text-white font-medium">{label}</p>
                <p className="text-xs text-white/50 uppercase mt-1">{desc}</p>
            </div>
            <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-indigo-500' : 'bg-white/10'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out mt-1 ml-1 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        </div>
    );
}
