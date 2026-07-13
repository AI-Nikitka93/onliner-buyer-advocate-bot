import React from "react";
import { Shield, TrendingDown, Users, Award, AlertTriangle, Sparkles } from "lucide-react";

interface StatsProps {
  stats: {
    savedMoneyTotal: number;
    impulsiveTriesBlocked: number;
    activeUsersCount: number;
    realDealsTracked: number;
  };
}

export default function StatsDashboard({ stats }: StatsProps) {
  return (
    <div className="relative">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
        
        {/* Metric 1: Impulsive Blocked */}
        <div className="p-4 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center space-x-4 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-teal-500/40 hover:shadow-[0_0_20px_rgba(20,184,166,0.05)] transition-all duration-300 group">
          <div className="p-3 bg-teal-500/15 rounded-xl text-teal-400 group-hover:scale-110 transition-transform duration-300">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Патруль Накруток</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-100">{stats.impulsiveTriesBlocked}</span>
              <span className="text-[9px] text-teal-400 font-semibold uppercase bg-teal-500/10 px-1 py-0.5 rounded">проверок</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Saved Budget */}
        <div className="p-4 bg-gradient-to-b from-indigo-950/20 via-slate-900/70 to-slate-950/80 border border-indigo-900/50 rounded-2xl flex items-center space-x-4 shadow-[0_4px_30px_rgba(99,102,241,0.08)] hover:border-indigo-500/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.12)] transition-all duration-300 group">
          <div className="p-3 bg-indigo-500/15 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform duration-300 relative">
            <TrendingDown className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-400 rounded-full animate-ping" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-300 inline" /> Спасенный Бюджет
            </p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-300">
                {stats.savedMoneyTotal.toLocaleString()} BYN
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Validated Solid Discounts */}
        <div className="p-4 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center space-x-4 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-yellow-500/40 hover:shadow-[0_0_20px_rgba(234,179,8,0.05)] transition-all duration-300 group">
          <div className="p-3 bg-yellow-500/15 rounded-xl text-yellow-400 group-hover:scale-110 transition-transform duration-300">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Реальных Скидок</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black font-mono tracking-tight text-yellow-500">{stats.realDealsTracked}</span>
              <span className="text-[9px] text-emerald-400 font-semibold uppercase bg-emerald-500/10 px-1 py-0.5 rounded">активных</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Users / Citizen Guard */}
        <div className="p-4 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center space-x-4 shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.05)] transition-all duration-300 group">
          <div className="p-3 bg-purple-500/15 rounded-xl text-purple-400 group-hover:scale-110 transition-transform duration-300">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Народный Патруль</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black font-mono tracking-tight text-purple-400">{stats.activeUsersCount}</span>
              <span className="text-[9px] text-slate-400 font-semibold uppercase">покупателей</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
