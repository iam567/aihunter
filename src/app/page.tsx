"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Target, Sparkles, AlertCircle, Star, Send, LockKeyhole } from 'lucide-react';

interface Candidate {
  name: string;
  handle: string;
  location: string;
  score: number;
  skills: string[];
  summary: string;
  reason: string;
  salary_fit: string;
  dm_open: boolean;
}

export default function AIHunterPage() {
  const [query, setQuery] = useState('');
  const [isHunting, setIsHunting] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [rawResult, setRawResult] = useState('');
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('');
  const [countdown, setCountdown] = useState(60);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [excludeHandles, setExcludeHandles] = useState<string[]>([]);
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('');
  const [salary, setSalary] = useState('');

  const nextBatch = () => {
    const currentHandles = candidates.map(c => c.handle).filter(Boolean);
    setExcludeHandles(prev => Array.from(new Set(prev.concat(currentHandles))));
    doHunt([...excludeHandles, ...currentHandles]);
  };

  const startHunt = () => {
    setExcludeHandles([]);
    doHunt([]);
  };

  const doHunt = async (excluded: string[]) => {
    if (!query.trim()) return;
    setIsHunting(true);
    setCandidates([]);
    setError('');
    setSearchSummary('');
    setRawResult('');
    setCountdown(60);

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

    // 倒计时
    let sec = 60;
    countdownRef.current = setInterval(() => {
      sec -= 1;
      setCountdown(sec > 0 ? sec : 0);
    }, 1000);

    try {
      // 把筛选条件拼入查询
      const filters = [
        gender ? `性别：${gender}` : '',
        location ? `工作地点：${location}` : '',
        language ? `工作语言：${language}` : '',
        salary ? `月薪预算：${salary}` : '',
      ].filter(Boolean).join('，');
      const fullQuery = filters ? `${query}。附加条件：${filters}` : query;

      const res = await fetch('/api/hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery, excludeHandles: excluded }),
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
      if (countdownRef.current) clearInterval(countdownRef.current);
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
住一<span className="text-yellow-400">AI猎头系统</span>
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

        {/* 筛选条件 */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* 性别 */}
          <div>
            <label className="text-xs text-gray-600 mb-1.5 block">👤 员工性别</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500/50"
            >
              <option value="">不限</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>

          {/* 月薪 */}
          <div>
            <label className="text-xs text-gray-600 mb-1.5 block">💴 月薪预算</label>
            <select
              value={salary}
              onChange={e => setSalary(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500/50"
            >
              <option value="">不限</option>
              <option value="10万日元左右">10万日元左右</option>
              <option value="20万日元左右">20万日元左右</option>
              <option value="30万日元左右">30万日元左右</option>
              <option value="50万日元左右">50万日元左右</option>
              <option value="100万日元左右">100万日元左右</option>
              <option value="300万日元左右">300万日元左右</option>
            </select>
          </div>

          {/* 工作地点 */}
          <div>
            <label className="text-xs text-gray-600 mb-1.5 block">📍 工作地点</label>
            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500/50"
            >
              <option value="">不限</option>
              <option value="北海道">北海道</option>
              <option value="埼玉県">埼玉県</option>
              <option value="東京都">東京都</option>
              <option value="京都府">京都府</option>
              <option value="大阪府">大阪府</option>
              <option value="兵庫県">兵庫県</option>
              <option value="奈良県">奈良県</option>
              <option value="和歌山県">和歌山県</option>
              <option value="福岡県">福岡県</option>
            </select>
          </div>

          {/* 工作语言 */}
          <div>
            <label className="text-xs text-gray-600 mb-1.5 block">🌐 工作语言</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-yellow-500/50"
            >
              <option value="">不限</option>
              <option value="中文">中文</option>
              <option value="日语">日语</option>
              <option value="英语">英语</option>
              <option value="越南语">越南语</option>
              <option value="韩语">韩语</option>
            </select>
          </div>
        </div>

        {/* 加载状态 */}
        {isHunting && (
          <div className="space-y-4">
            {/* 警示横幅 */}
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-5 py-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-yellow-400 font-bold text-sm">AI 正在自动检索中，请勿关闭窗口</p>
                <p className="text-yellow-400/60 text-xs mt-0.5">正在实时分析 X 上的用户推文，请耐心等待...</p>
              </div>
              {/* 倒计时圆环 */}
              <div className="shrink-0 relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#422006" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke="#eab308" strokeWidth="3"
                    strokeDasharray={`${(countdown / 60) * 94.2} 94.2`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-yellow-400 font-black text-xs">
                  {countdown}
                </span>
              </div>
            </div>

            {/* 状态文字 + 三点 */}
            <div className="text-center py-6 space-y-3">
              <div className="flex justify-center gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-yellow-500/70 text-sm">{statusText}</p>
            </div>
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

              <div className="flex gap-4 ml-10 text-xs mb-4">
                <div className="flex items-start gap-1.5 text-green-500/80 flex-1">
                  <Target className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{p.reason}</span>
                </div>
                {p.salary_fit && (
                  <div className="text-blue-400/70 shrink-0">{p.salary_fit}</div>
                )}
              </div>

              {/* 发私信按钮 */}
              <div className="ml-10">
                {p.dm_open !== false ? (
                  <a
                    href={`https://x.com/${p.handle.replace(/[@\s]/g,'').trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-4 py-2 rounded-full transition"
                  >
                    <Send className="w-3 h-3" />
                    发私信联系
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-gray-600 text-xs bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    <LockKeyhole className="w-3 h-3" />
                    私信未开放
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 换一批按钮 */}
        {candidates.length > 0 && !isHunting && (
          <div className="text-center pt-4 pb-8">
            <button
              onClick={nextBatch}
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-white/10 hover:border-yellow-500/30 text-gray-300 hover:text-yellow-400 px-6 py-3 rounded-full text-sm font-medium transition"
            >
              <Sparkles className="w-4 h-4" />
              换一批候选人
              <span className="text-xs text-gray-600 ml-1">已排除 {excludeHandles.length + candidates.length} 人</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
