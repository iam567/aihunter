"use client"
import React, { useState, useRef } from 'react';
import { Search, MapPin, Calendar, ExternalLink, Sparkles, AlertCircle, Megaphone } from 'lucide-react';

interface EventResult {
  name: string;
  name_ja: string;
  date: string;
  location: string;
  prefecture: string;
  handle: string;
  account_name: string;
  description: string;
  free: boolean;
}

const PREFECTURES = ['不限','北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];

const PERIODS = ['不限','今週','来週','今月','来月','3ヶ月以内'];

const TYPES = ['不限','祭り','花火大会','フリーマーケット','音楽イベント','アニメ・コスプレ','グルメイベント','スポーツ','伝統行事','その他'];

export default function EventHunterPage() {
  const [keyword, setKeyword] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [period, setPeriod] = useState('');
  const [eventType, setEventType] = useState('');
  const [isHunting, setIsHunting] = useState(false);
  const [events, setEvents] = useState<EventResult[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [statusText, setStatusText] = useState('');
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [excludeNames, setExcludeNames] = useState<string[]>([]);

  const nextBatch = () => {
    const names = events.map(e => e.name).filter(Boolean);
    const newExclude = Array.from(new Set(excludeNames.concat(names)));
    setExcludeNames(newExclude);
    doHunt(newExclude);
  };

  const startHunt = () => {
    setExcludeNames([]);
    doHunt([]);
  };

  const doHunt = async (excluded: string[]) => {
    setIsHunting(true);
    setEvents([]);
    setError('');
    setSummary('');
    setCountdown(60);

    const steps = ['正在搜索 X 上的最新活动信息...','正在分析活动详情...','正在整理活动列表...','即将完成...'];
    let i = 0;
    setStatusText(steps[0]);
    const timer = setInterval(() => { i = (i + 1) % steps.length; setStatusText(steps[i]); }, 2500);
    let sec = 60;
    countdownRef.current = setInterval(() => { sec -= 1; setCountdown(sec > 0 ? sec : 0); }, 1000);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, prefecture, period, eventType, excludeNames: excluded }),
      });
      clearInterval(timer);
      const data = await res.json();
      if (data.error) setError(data.error);
      else { setEvents(data.events || []); setSummary(data.summary || ''); }
    } catch {
      clearInterval(timer);
      setError('网络错误，请重试');
    } finally {
      setIsHunting(false);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0a0a0a' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top, #1a0505, #0a0a0a 60%)' }} />

      {/* 导航 */}
      <nav className="relative z-10 px-6 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: '#dc2626' }}>
            <Megaphone className="text-white w-4 h-4" />
          </div>
          <span className="text-lg font-black tracking-tighter text-white">EVENTHUNTER</span>
        </div>
        <span className="text-xs text-gray-600 border border-white/10 px-3 py-1 rounded-full">Powered by Grok × X</span>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto pt-14 px-6 pb-20">
        {/* 标题 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
            日本<span style={{ color: '#ef4444' }}>祭り・イベント</span>検索
          </h1>
          <p className="text-gray-500 text-sm">X で話題の最新イベントをAIがリアルタイム検索</p>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-5">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl">
            <Search className="ml-3 text-gray-600 w-4 h-4 shrink-0" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startHunt()}
              placeholder="キーワード（例：花火、阿波踊り、コスプレ...）"
              className="flex-1 bg-transparent text-white text-sm p-2 placeholder:text-gray-600 focus:outline-none"
            />
            <button
              onClick={startHunt}
              disabled={isHunting}
              className="shrink-0 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-1.5 disabled:opacity-40"
              style={{ background: isHunting ? '#7f1d1d' : '#dc2626' }}
            >
              {isHunting ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {isHunting ? '検索中' : '検索'}
            </button>
          </div>
        </div>

        {/* 筛选条件 */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div>
            <label className="text-xs text-gray-600 mb-1.5 block">📍 都道府県</label>
            <select value={prefecture} onChange={e => setPrefecture(e.target.value)} className="w-full bg-zinc-900 border border-white/10 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none">
              {PREFECTURES.map(p => <option key={p} value={p === '不限' ? '' : p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1.5 block">📅 開催時期</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-zinc-900 border border-white/10 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none">
              {PERIODS.map(p => <option key={p} value={p === '不限' ? '' : p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1.5 block">🎪 イベント種別</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full bg-zinc-900 border border-white/10 text-gray-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none">
              {TYPES.map(t => <option key={t} value={t === '不限' ? '' : t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* 加载状态 */}
        {isHunting && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 rounded-2xl px-5 py-4" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)' }}>
              <Sparkles className="w-4 h-4 animate-pulse" style={{ color: '#ef4444' }} />
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: '#ef4444' }}>AIが検索中です、画面を閉じないでください</p>
                <p className="text-xs mt-0.5 text-red-400/60">X のリアルタイム投稿を分析しています...</p>
              </div>
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#3f0f0f" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#dc2626" strokeWidth="3" strokeDasharray={`${(countdown/60)*94.2} 94.2`} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-black text-xs" style={{ color: '#ef4444' }}>{countdown}</span>
              </div>
            </div>
            <div className="text-center py-4 space-y-2">
              <div className="flex justify-center gap-1.5">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#dc2626', animationDelay: `${i*0.15}s` }} />)}
              </div>
              <p className="text-sm text-red-400/70">{statusText}</p>
            </div>
          </div>
        )}

        {/* 错误 */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span>
          </div>
        )}

        {/* 总结 */}
        {summary && (
          <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: 'rgba(239,68,68,0.85)' }}>
            🎌 {summary}
          </div>
        )}

        {/* 活动卡片列表 */}
        <div className="space-y-4">
          {events.map((ev, idx) => (
            <div key={idx} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 hover:border-red-500/20 transition">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white font-bold text-base leading-tight flex-1 mr-3">{ev.name}</h3>
                {ev.free && <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.15)', color: '#ef4444' }}>無料</span>}
              </div>

              <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-500">
                {ev.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ev.date}</span>}
                {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>}
              </div>

              <p className="text-gray-400 text-xs leading-relaxed mb-4 bg-black/20 rounded-xl p-3">{ev.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ev.handle && (
                    <a href={`https://x.com/${ev.handle.replace(/[@\s]/g,'')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#dc2626' }}>
                        {ev.account_name?.[0] || 'X'}
                      </div>
                      {ev.handle}
                    </a>
                  )}
                </div>
                {ev.handle && (
                  <a
                    href={`https://x.com/search?q=${encodeURIComponent(ev.name_ja || ev.name)}&src=typed_query`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition text-white"
                    style={{ background: '#dc2626' }}>
                    <ExternalLink className="w-3 h-3" />X で見る
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 换一批按钮 */}
        {events.length > 0 && !isHunting && (
          <div className="text-center pt-4 pb-8">
            <button
              onClick={nextBatch}
              className="inline-flex items-center gap-2 border border-white/10 hover:border-red-500/30 text-gray-300 hover:text-red-400 px-6 py-3 rounded-full text-sm font-medium transition"
              style={{ background: 'rgba(39,39,42,0.8)' }}
            >
              <Sparkles className="w-4 h-4" />
              换一批活动
              <span className="text-xs text-gray-600 ml-1">已排除 {excludeNames.length + events.length} 条</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
