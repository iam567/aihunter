"use client"
import React, { useState } from 'react';
import { Search, MapPin, Target, Sparkles, AlertCircle, Star } from 'lucide-react';

interface Candidate {
  name: string;
  handle: string;
  location: string;
  score: number;
  skills: string[];
  summary: string;
  reason: string;
  salary_fit: string;
}

export default function AIHunterPage() {
  const [query, setQuery] = useState('');
  const [isHunting, setIsHunting] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [rawResult, setRawResult] = useState('');
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('');

  const startHunt = async () => {
    if (!query.trim()) return;
    setIsHunting(true);
    setCandidates([]);
    setError('');
    setSearchSummary('');
    setRawResult('');

    const steps = [
      '正在分析招聘需求...',
      '正在搜索 X 上的活跃用户...',
      '正在分析用户推文内容...',
      '正在评估技能匹配度...',
      '生成候选人画像中...',
    ];
    let i = 0;
    setStatusText(steps[0]);
    const timer = setInterval(() => {
      i = (i + 1) % steps.length;
      setStatusText(steps[i]);
    }, 2000);

    try {
      const res = await fetch('/api/hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      clearInterval(timer);
      if (data.error) {
        setError(data.error);
      } else {
        setCandidates(data.candidates || []);
        setSearchSummary(data.search_summary || '');
        setRawResult(data.raw_result || '');
      }
    } catch (e: any) {
      clearInterval(timer);
      setError('网络错误，请重试');
    } finally {
      setIsHunting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startHunt(); }
  };

  return (
    <div className="min-h-screen font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,#1c1400,#0a0a0a_60%)] pointer-events-none" />

      {/* 导航 */}
      <nav className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-500 p-1.5 rounded-lg">
            <Target className="text-black w-4 h-4" />
          </div>
          <span className="text-lg font-black tracking-tighter text-white">AIHUNTER</span>
        </div>
        <span className="text-xs text-gray-600 border border-white/10 px-3 py-1 rounded-full">Powered by Grok</span>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto pt-16 px-6 pb-20">
        {/* 标题 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight leading-tight">
            寻找你的<br /><span className="text-yellow-400">最强人才。</span>
          </h1>
          <p className="text-gray-500 text-sm">基于 X 实时推文分析，精准猎获最匹配的候选人</p>
        </div>

        {/* 搜索框 */}
        <div className="relative group mb-10">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600/50 to-orange-600/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
          <div className="relative bg-zinc-900 border border-white/10 rounded-2xl p-2 flex items-start gap-2 shadow-2xl">
            <Search className="ml-3 mt-3.5 text-gray-600 w-4 h-4 shrink-0" />
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述你的招聘需求，例如：寻找在东京的、懂AI办公、接受30万日元月薪的职员..."
              rows={3}
              className="flex-1 bg-transparent text-white text-sm p-2 placeholder:text-gray-600 resize-none focus:outline-none"
            />
            <button
              onClick={startHunt}
              disabled={isHunting || !query.trim()}
              className="shrink-0 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black px-5 py-2.5 rounded-xl font-bold text-sm transition mt-1 flex items-center gap-1.5"
            >
              {isHunting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
              {isHunting ? '狩猎中' : '开始狩猎'}
            </button>
          </div>
        </div>

        {/* 加载状态 */}
        {isHunting && (
          <div className="text-center py-12 space-y-3">
            <div className="flex justify-center gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <p className="text-yellow-500/80 text-sm animate-pulse">{statusText}</p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 搜索总结 */}
        {searchSummary && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6 text-yellow-400/80 text-sm">
            🎯 {searchSummary}
          </div>
        )}

        {/* 兜底：原始搜索结果 */}
        {rawResult && candidates.length === 0 && (
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {rawResult}
          </div>
        )}

        {/* 候选人列表 */}
        <div className="space-y-4">
          {candidates.map((p, idx) => (
            <div key={idx} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 hover:border-yellow-500/20 transition group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-black font-bold text-xs">
                      {p.name?.[0] || '?'}
                    </div>
                    <div>
                      <a href={`https://x.com/${p.handle.replace(/[@\s]/g,'').trim()}`} target="_blank" rel="noopener noreferrer" className="text-white font-bold text-sm hover:text-yellow-400 transition">
                        {p.name}
                      </a>
                      <a href={`https://x.com/${p.handle.replace(/[@\s]/g,'').trim()}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 text-xs ml-2 hover:text-yellow-500 transition underline-offset-2 hover:underline">
                        {p.handle} ↗
                      </a>
                    </div>
                  </div>
                  {p.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-600 ml-10">
                      <MapPin className="w-3 h-3" />
                      <span>{p.location}</span>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-yellow-400 font-black text-xl">{p.score}</span>
                  </div>
                  <span className="text-xs text-gray-600">匹配分</span>
                </div>
              </div>

              {/* 技能标签 */}
              {p.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 ml-10">
                  {p.skills.map((s, i) => (
                    <span key={i} className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/10">{s}</span>
                  ))}
                </div>
              )}

              <div className="bg-black/20 rounded-xl p-3 mb-3 text-gray-400 text-xs leading-relaxed ml-10">
                {p.summary}
              </div>

              <div className="flex gap-4 ml-10 text-xs">
                <div className="flex items-start gap-1.5 text-green-500/80 flex-1">
                  <Target className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{p.reason}</span>
                </div>
                {p.salary_fit && (
                  <div className="text-blue-400/70 shrink-0">{p.salary_fit}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
