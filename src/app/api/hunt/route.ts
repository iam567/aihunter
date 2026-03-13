import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: '请输入搜索需求' }, { status: 400 });

  const prompt = `你是一个专业的AI猎头助手。
用户的招聘需求是：「${query}」

请你使用搜索工具，在 X (Twitter) 上搜索符合以下条件的真实用户：
1. 根据用户的推文内容，判断其是否具备招聘需求中的技能
2. 寻找5-8个最匹配的候选人
3. 对每个候选人，分析其推文来判断：技能匹配度、工作意向、薪资接受度

返回 JSON 格式，结构如下（只返回JSON，不要其他文字）：
{
  "candidates": [
    {
      "name": "显示名称",
      "handle": "@用户名",
      "location": "地区（从推文推断）",
      "score": 匹配分数(0-100),
      "skills": ["技能1", "技能2"],
      "summary": "基于推文内容的分析总结（2-3句话）",
      "reason": "推荐理由",
      "salary_fit": "薪资匹配判断"
    }
  ],
  "search_summary": "本次搜索总结"
}`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [{ role: 'user', content: prompt }],
        search_parameters: {
          mode: 'on',
          sources: [{ type: 'x' }],
        },
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: '解析失败，请重试', raw: content }, { status: 500 });

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
