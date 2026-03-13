import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: '请输入搜索需求' }, { status: 400 });

  const prompt = `你是专业AI猎头助手。用户招聘需求：「${query}」

请搜索X(Twitter)上符合条件的真实用户，找5个最匹配的候选人。

严格只返回以下JSON格式，不要任何其他文字、不要markdown代码块：
{"candidates":[{"name":"名字","handle":"@用户名","location":"地区（从推文推断，不确定写未知）","score":85,"skills":["技能1","技能2"],"summary":"基于推文内容的分析（2-3句话）","reason":"推荐理由","salary_fit":"薪资匹配判断"}],"search_summary":"本次搜索总结"}`;

  try {
    const response = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-fast-non-reasoning',
        input: [{ role: 'user', content: prompt }],
        tools: [{ type: 'x_search' }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: `API错误: ${data.error || response.status}` }, { status: 500 });
    }

    // 从 output 里提取文字内容
    let content = '';
    for (const output of data.output || []) {
      if (output.type === 'message') {
        for (const c of output.content || []) {
          if (c.text) content += c.text;
        }
      }
    }

    if (!content) {
      return NextResponse.json({ error: '未获取到结果，请重试' }, { status: 500 });
    }

    // 提取 JSON（去掉 markdown 代码块）
    let jsonStr = content.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1) jsonStr = jsonStr.slice(start, end + 1);

    try {
      const result = JSON.parse(jsonStr);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: '解析失败，请重试', debug: content.slice(0, 500) }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
