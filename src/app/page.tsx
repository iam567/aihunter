"use client"
import React, { useState } from 'react';
import { Search, User, Zap, Twitter, Github, MapPin, Target, Sparkles } from 'lucide-react';

export default function AIHunterLanding() {
  const [query, setQuery] = useState('');
  const [isHunting, setIsHunting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const startHunt = () => {
    if (!query) return;
    setIsHunting(true);
    // 模拟搜索延迟
    setTimeout(() => {
      setResults([
        {
          id: 1,
          name: "みどちん",
          handle: "@ZerowakuBlog",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
          score: 98,
          location: "东京 / 远程",
          summary: "AI 办公专家，熟练使用 ChatGPT/Claude 进行业务流优化。近期发布多篇关于 AI 提效的深度博文。",
          reason: "与您要求的 30万日元薪资高度匹配，且具备实战案例。"
        },
        {
          id: 2,
          name: "おっくそ",
          handle: "@ok_kushun",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
          score: 92,
          location: "大阪",
          summary: "全栈开发者，专注 AI 评价与工具落地。在 X 上活跃度极高，言论逻辑清晰。",
          reason: "技术能力过硬，对 AI 行业有独到见解。"
        }
      ]);
      setIsHunting(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen font-sans">
      {/* 背景装饰 */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,#1a1a1a,0%,#0a0a0a_100%)] pointer-events-none" />
      
      {/* 导航栏 */}
      <nav className="relative z-10 p-6 flex justify-between items-center border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-500 p-1.5 rounded-lg">
            <Target className="text-black w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">AIHUNTER</span>
        </div>
        <div className="flex gap-4">
          <button className="text-sm text-gray-400 hover:text-white transition">我的猎物</button>
          <button className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition">设置</button>
        </div>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto pt-20 px-6">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">寻找你的<br/><span className="text-yellow-500">最强人才。</span></h1>
          <p className="text-gray-400">基于 X (Twitter) 实时语境分析，像猎人一样捕获最匹配的人选。</p>
        </div>

        {/* 搜索框 */}
        <div className="relative group mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
          <div className="relative bg-zinc-900 border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl">
            <Search className="ml-4 text-gray-500 w-5 h-5" />
            <input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入你的指令，例如：寻找东京懂AI办公的职员..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white p-4 placeholder:text-gray-600"
            />
            <button 
              onClick={startHunt}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold transition flex items-center gap-2"
            >
              {isHunting ? <Zap className="animate-spin w-4 h-4" /> : <Zap className="w-4 h-4" />}
              开始狩猎
            </button>
          </div>
        </div>

        {/* 状态展示 */}
        {isHunting && (
          <div className="text-center py-10">
            <div className="inline-flex items-center gap-2 text-yellow-500 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>正在分析 X 用户推文...</span>
            </div>
          </div>
        )}

        {/* 结果列表 */}
        <div className="space-y-4 pb-20">
          {results.map(person => (
            <div key={person.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:border-yellow-500/30 transition group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <img src={person.avatar} className="w-14 h-14 rounded-full bg-zinc-800" alt="avatar" />
                  <div>
                    <h3 className="text-white font-bold text-lg">{person.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Twitter className="w-3 h-3" />
                      <span>{person.handle}</span>
                      <span>•</span>
                      <MapPin className="w-3 h-3" />
                      <span>{person.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">匹配度</div>
                  <div className="text-2xl font-black text-yellow-500">{person.score}%</div>
                </div>
              </div>
              
              <div className="bg-black/30 rounded-xl p-4 mb-4">
                <p className="text-gray-300 text-sm leading-relaxed">{person.summary}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-green-500 font-medium">
                <Target className="w-3 h-3" />
                <span>推荐理由：{person.reason}</span>
              </div>
              
              <div className="mt-6 flex gap-3 opacity-0 group-hover:opacity-100 transition">
                <button className="flex-1 bg-white text-black py-2 rounded-lg font-bold text-sm">查看完整画像</button>
                <button className="px-4 bg-zinc-800 text-white py-2 rounded-lg font-bold text-sm">联系 TA</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
