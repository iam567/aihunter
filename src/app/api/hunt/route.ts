import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: '请输入搜索需求' }, { status: 400 });

  try {
    // ── Step 1: 让 Grok 真正搜索 X，用自然语言返回 ──
    const searchRes = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-fast-non-reasoning',
        input: [{
          role: 'user',
          content: `请在X(Twitter)上搜索符合以下招聘需求的真实用户：「${query}」

请找出5-8个真实存在的X账号，对每个人必须提供：
1. 【精确的X用户名】格式必须是 @英文字母数字下划线，例如 @username123，这是用于生成链接的关键字段，必须100%准确
2. 显示名称（昵称）
3. 他们发布过什么内容能证明他们符合要求
4. 从推文推断的技能和所在地区
5. 推荐理由

重要：@用户名必须是真实存在的X账号用户名，可以直接访问 x.com/用户名 找到该用户。不要编造。`
        }],
        tools: [{ type: 'x_search' }],
      }),
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      return NextResponse.json({ error: `搜索失败: ${searchRes.status}`, detail: err.slice(0, 200) }, { status: 500 });
    }

    const searchData = await searchRes.json();

    // 提取搜索结果文字
    let searchContent = '';
    for (const output of searchData.output || []) {
      if (output.type === 'message') {
        for (const c of output.content || []) {
          if (c.text) searchContent += c.text;
        }
      }
    }

    if (!searchContent) {
      return NextResponse.json({ error: '搜索无结果，请换个关键词' }, { status: 500 });
    }

    // ── Step 2: 用 grok-3 把自然语言结果整理成 JSON ──
    const formatRes = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          {
            role: 'system',
            content: '你是一个数据整理助手。将用户给你的候选人信息整理成指定JSON格式，不要添加任何其他文字。',
          },
          {
            role: 'user',
            content: `将以下候选人信息整理成JSON，只返回JSON不要其他内容：

${searchContent}

注意：handle字段必须是纯英文用户名，格式为@username（只含字母数字下划线），用于生成 x.com/username 链接，必须准确。

目标格式：
{"candidates":[{"name":"显示名称","handle":"@纯英文用户名","location":"地区或未知","score":匹配分0-100,"skills":["技能1","技能2"],"summary":"2句话总结","reason":"推荐理由","salary_fit":"薪资匹配判断"}],"search_summary":"一句话总结"}`,
          }
        ],
        temperature: 0.1,
      }),
    });

    const formatData = await formatRes.json();
    const raw = formatData.choices?.[0]?.message?.content || '';

    let jsonStr = raw.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1) jsonStr = jsonStr.slice(start, end + 1);

    try {
      return NextResponse.json(JSON.parse(jsonStr));
    } catch {
      // 解析失败时直接返回搜索结果文字
      return NextResponse.json({
        candidates: [],
        search_summary: '',
        raw_result: searchContent,
      });
    }

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
