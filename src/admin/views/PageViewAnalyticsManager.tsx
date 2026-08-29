import React, { useEffect, useState } from 'react';
import { Activity, Users, Compass, Layers, RefreshCw, Globe, Search, Share2, Monitor, Smartphone, Tablet } from 'lucide-react';
import { fetchPageViewAnalytics, PageViewAnalyticsSummary } from '../../utils/pageViewAnalyticsEngine';

interface PageViewAnalyticsManagerProps {
    daysRange?: number | 'all';
    hideTimeframePills?: boolean;
}

export function PageViewAnalyticsManager({ daysRange: propDaysRange = 30, hideTimeframePills = true }: PageViewAnalyticsManagerProps) {
    const [daysRange, setDaysRange] = useState<number | 'all'>(propDaysRange);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<PageViewAnalyticsSummary | null>(null);

    useEffect(() => {
        setDaysRange(propDaysRange);
    }, [propDaysRange]);

    const loadData = async (range: number | 'all') => {
        setLoading(true);
        try {
            const data = await fetchPageViewAnalytics(range);
            setSummary(data);
        } catch (err) {
            console.error('Failed to load page view analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(daysRange); }, [daysRange]);

    const stats = summary?.stats;

    return (
        <div className="space-y-6 text-[#1b2520] font-sans animate-fadeIn select-none">
            
            {/* TIMEFRAME SELECTOR PILLS */}
            {!hideTimeframePills && (
                <div className="flex justify-end items-center gap-2">
                <div className="bg-white p-1 rounded-full border border-gray-200/90 shadow-2xs flex items-center gap-0.5">
                    {[
                        { label: 'Today', val: 1 },
                        { label: '7D', val: 7 },
                        { label: '30D', val: 30 },
                        { label: '90D', val: 90 },
                        { label: 'All', val: 'all' }
                    ].map(btn => (
                        <button
                            key={btn.label}
                            onClick={() => setDaysRange(btn.val as any)}
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                                daysRange === btn.val
                                    ? 'bg-[#15221c] text-white shadow-xs'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => loadData(daysRange)}
                    disabled={loading}
                    className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-full text-gray-700 transition-all cursor-pointer shadow-2xs"
                    title="Refresh Data"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            )}

            {loading && !summary ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                </div>
            ) : summary && stats && (
                <div className="space-y-6">
                    
                    {/* 4 TOP KPI CARDS MATCHING SCREENSHOT */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* Card 1: TOTAL PAGE VIEWS */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                                    TOTAL PAGE VIEWS
                                </span>
                                <div className="w-8 h-8 rounded-full bg-[#eef5fe] text-[#2563eb] flex items-center justify-center">
                                    <Activity className="w-4 h-4 stroke-[2.5]" />
                                </div>
                            </div>

                            <div className="text-3.5xl font-black text-[#15221c] font-mono">
                                {stats.totalViews}
                            </div>

                            <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                                <span>Unique views tracked</span>
                                <span className="bg-[#eef5fe] text-[#2563eb] px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                                    Views
                                </span>
                            </div>
                        </div>

                        {/* Card 2: UNIQUE VISITORS */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                                    UNIQUE VISITORS
                                </span>
                                <div className="w-8 h-8 rounded-full bg-[#ebf7f0] text-[#16a34a] flex items-center justify-center">
                                    <Users className="w-4 h-4 stroke-[2.5]" />
                                </div>
                            </div>

                            <div className="text-3.5xl font-black text-[#15221c] font-mono">
                                {stats.uniqueVisitors}
                            </div>

                            <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                                <span>Unique visitor IDs</span>
                                <span className="bg-[#ebf7f0] text-[#16a34a] px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                                    Users
                                </span>
                            </div>
                        </div>

                        {/* Card 3: TOTAL ACTION EVENTS */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                                    TOTAL ACTION EVENTS
                                </span>
                                <div className="w-8 h-8 rounded-full bg-[#f5f0ff] text-[#9333ea] flex items-center justify-center">
                                    <Compass className="w-4 h-4 stroke-[2.5]" />
                                </div>
                            </div>

                            <div className="text-3.5xl font-black text-[#15221c] font-mono">
                                {stats.totalActionEvents}
                            </div>

                            <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                                <span>Micro-conversions & clicks</span>
                                <span className="bg-[#f5f0ff] text-[#9333ea] px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                                    Events
                                </span>
                            </div>
                        </div>

                        {/* Card 4: AVG VIEWS / SESSION */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                                    AVG VIEWS / SESSION
                                </span>
                                <div className="w-8 h-8 rounded-full bg-[#fffbeb] text-[#d97706] flex items-center justify-center">
                                    <Layers className="w-4 h-4 stroke-[2.5]" />
                                </div>
                            </div>

                            <div className="text-3.5xl font-black text-[#15221c] font-mono">
                                {stats.avgViewsPerSession.toFixed(1)}
                            </div>

                            <div className="flex justify-between items-center text-[11px] font-semibold text-gray-500 pt-1 border-t border-gray-100">
                                <span>Engagement depth</span>
                                <span className="bg-[#fffbeb] text-[#d97706] px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                                    Depth
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* MIDDLE ROW: TOP VISITED PAGES VS TRAFFIC CHANNELS & DEVICE USAGE */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Left Panel: Top Visited Pages (8 Cols) */}
                        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-6">
                            <div>
                                <h3 className="font-extrabold text-base text-[#15221c] tracking-tight">Top Visited Pages</h3>
                                <p className="text-xs text-gray-400 font-semibold mt-0.5">
                                    Page paths that received the most traffic
                                </p>
                            </div>

                            {/* List of Progress Bars for Pages */}
                            <div className="space-y-5">
                                {stats.topVisitedPages.map((page, idx) => (
                                    <div key={idx} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="text-[#15221c] font-sans">
                                                <span className="text-gray-400 font-mono font-semibold mr-1.5">#{idx + 1}</span>
                                                {page.name}
                                            </span>
                                            <span className="text-gray-700 font-mono font-extrabold">
                                                {page.views} views
                                            </span>
                                        </div>

                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#2563eb] rounded-full transition-all duration-500"
                                                style={{ width: `${Math.max(page.percent, 8)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel: Traffic Channels & Device Usage (4 Cols) */}
                        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-6 flex flex-col justify-between">
                            
                            {/* Section 1: Traffic Channels */}
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                                    TRAFFIC CHANNELS
                                </h4>

                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700 font-bold flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                                            Direct Traffic
                                        </span>
                                        <span className="font-mono font-extrabold text-gray-900">
                                            {stats.trafficChannels.find(c => c.name === 'Direct Traffic')?.percent || 0}%
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700 font-bold flex items-center gap-2">
                                            <Search className="w-3.5 h-3.5 text-gray-400" />
                                            Search Engines
                                        </span>
                                        <span className="font-mono font-extrabold text-gray-900">
                                            {stats.trafficChannels.find(c => c.name === 'Search Engines')?.percent || 0}%
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700 font-bold flex items-center gap-2">
                                            <Share2 className="w-3.5 h-3.5 text-gray-400" />
                                            Referrals & Social
                                        </span>
                                        <span className="font-mono font-extrabold text-gray-900">
                                            {stats.trafficChannels.find(c => c.name === 'Referrals & Social')?.percent || 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Divider Line */}
                            <div className="border-t border-gray-100" />

                            {/* Section 2: Device Usage */}
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                                    DEVICE USAGE
                                </h4>

                                <div className="space-y-3 text-xs">
                                    {/* Desktop */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-bold flex items-center gap-2">
                                                <Monitor className="w-3.5 h-3.5 text-gray-500" />
                                                Desktop
                                            </span>
                                            <span className="font-mono font-extrabold text-gray-900">
                                                {stats.deviceUsage.find(d => d.name === 'Desktop')?.percent || 100}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#1b2520] rounded-full"
                                                style={{ width: `${stats.deviceUsage.find(d => d.name === 'Desktop')?.percent || 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Mobile */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-bold flex items-center gap-2">
                                                <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                                                Mobile
                                            </span>
                                            <span className="font-mono font-extrabold text-gray-900">
                                                {stats.deviceUsage.find(d => d.name === 'Mobile')?.percent || 0}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#1b2520] rounded-full"
                                                style={{ width: `${stats.deviceUsage.find(d => d.name === 'Mobile')?.percent || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Tablet */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-bold flex items-center gap-2">
                                                <Tablet className="w-3.5 h-3.5 text-gray-500" />
                                                Tablet
                                            </span>
                                            <span className="font-mono font-extrabold text-gray-900">
                                                {stats.deviceUsage.find(d => d.name === 'Tablet')?.percent || 0}%
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#1b2520] rounded-full"
                                                style={{ width: `${stats.deviceUsage.find(d => d.name === 'Tablet')?.percent || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>

                    </div>

                    {/* BOTTOM ROW: USER INTERACTION EVENT LOG TABLE MATCHING SCREENSHOT */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
                        
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="font-extrabold text-base text-[#15221c] tracking-tight">User Interaction Event Log</h3>
                            <p className="text-xs text-gray-400 font-semibold mt-0.5">
                                Recent micro-conversions and engagement events triggered on-site
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[#fcfdfc] border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider font-mono">
                                    <tr>
                                        <th className="p-4">EVENT</th>
                                        <th className="p-4">DETAILS</th>
                                        <th className="p-4 text-right">VALUE / QTY</th>
                                        <th className="p-4 text-right">TIME</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stats.interactionLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            
                                            {/* EVENT BADGE */}
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase border ${log.badgeStyle}`}>
                                                    {log.eventTag}
                                                </span>
                                            </td>

                                            {/* DETAILS */}
                                            <td className="p-4 font-semibold text-gray-700">
                                                {log.details}
                                            </td>

                                            {/* VALUE / QTY */}
                                            <td className="p-4 text-right font-mono font-bold text-gray-900">
                                                {log.valueQty}
                                            </td>

                                            {/* TIME */}
                                            <td className="p-4 text-right font-mono text-gray-400 text-[11px]">
                                                {log.time}
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}
