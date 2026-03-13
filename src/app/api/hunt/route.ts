import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: '请输入搜索需求' }, { status: 400 });

  const prompt = `你是专业AI猎头助手。用户招聘需求：「${query}」

请搜索X(Twitter)上符合条件的真实用户，返回5个候选人。

严格只返回以下JSON格式，不要任何其他文字、不要markdown代码块：
{"candidates":[{"name":"名字","handle":"@用户名","location":"地区","score":85,"skills":["技能1","技能2"],"summary":"推文分析总结","reason":"推荐理由","salary_fit":"薪资判断"}],"search_summary":"搜索总结"}`;

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
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    // API 报错处理
    if (!response.ok) {
      return NextResponse.json({ error: `API错误: ${data.error?.message || response.status}` }, { status: 500 });
    }

    const content = data.choices?.[0]?.message?.content || '';

    // 多种方式提取 JSON
    let jsonStr = content.trim();

    // 去掉 markdown 代码块
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    // 找到第一个 { 到最后一个 }
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      jsonStr = jsonStr.slice(start, end + 1);
    }

    try {
      const result = JSON.parse(jsonStr);
      return NextResponse.json(result);
    } catch {
      // JSON 解析失败，返回原始内容方便调试
      return NextResponse.json({ 
        error: '解析失败，请重试', 
        debug: content.slice(0, 500) 
      }, { status: 500 });
    }

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
