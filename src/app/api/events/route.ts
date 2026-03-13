import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { keyword, prefecture, period, eventType, excludeNames = [] } = await req.json();
  const excludeNote = excludeNames.length > 0
    ? `\n\n以下のイベントは既に表示済みのため除外してください：${excludeNames.join('、')}` : '';

  const conditions = [
    keyword ? `キーワード：${keyword}` : '',
    prefecture ? `開催地：${prefecture}` : '',
    period ? `開催時期：${period}` : '',
    eventType ? `イベント種別：${eventType}` : '',
  ].filter(Boolean).join('、');

  const query = conditions || '日本の祭り・イベント全般';

  try {
    // Step 1: Grok で X を検索
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
          content: `X(Twitter)で最近宣伝されている日本の祭り・イベント情報を検索してください。条件：${query}

各イベントについて以下を教えてください：
1. イベント名（正式名称）
2. 開催日程（わかる範囲で）
3. 開催場所・会場名
4. 都道府県
5. 宣伝しているXアカウント（@ユーザー名、必ず正確なものを）
6. アカウントの表示名
7. イベントの概要・見どころ
8. 入場料（無料かどうか）
9. そのイベントを宣伝している具体的な推文のID（tweet IDの数字列、例：1234567890123456789）またはツイートURL

X上で実際に宣伝されている本物のイベントのみ掲載してください。8〜12件探してください。${excludeNote}`,
        }],
        tools: [{ type: 'x_search' }],
      }),
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      return NextResponse.json({ error: `検索失敗: ${searchRes.status}`, detail: err.slice(0, 200) }, { status: 500 });
    }

    const searchData = await searchRes.json();
    let searchContent = '';
    for (const output of searchData.output || []) {
      if (output.type === 'message') {
        for (const c of output.content || []) {
          if (c.text) searchContent += c.text;
        }
      }
    }

    if (!searchContent) {
      return NextResponse.json({ error: '結果が見つかりませんでした' }, { status: 500 });
    }

    // Step 2: JSON に整形
    const formatRes = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          { role: 'system', content: 'データ整形アシスタントです。指定のJSON形式のみ返してください。' },
          {
            role: 'user',
            content: `以下のイベント情報をJSONに整形してください。JSONのみ返してください：

${searchContent}

重要：name/date/location/description/summaryはすべて中国語（简体中文）に翻訳してください。ただしname_jaは必ず日本語原文のまま保持してください（X検索に使用するため）。handleは@英数字のみ。

形式：
{"events":[{"name":"活动名称(中文)","name_ja":"イベント名日本語原文","date":"日期(中文)","location":"会场地址(中文)","prefecture":"都道府县","handle":"@英数字ユーザー名","account_name":"アカウント名","description":"活动介绍2句话(中文)","free":true/false}],"summary":"一句话总结(中文)"}`,
          }
        ],
        temperature: 0.1,
      }),
    });

    const formatData = await formatRes.json();
    const raw = formatData.choices?.[0]?.message?.content || '';
    let jsonStr = raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'');
    const s = jsonStr.indexOf('{'), e = jsonStr.lastIndexOf('}');
    if (s !== -1 && e !== -1) jsonStr = jsonStr.slice(s, e+1);

    try {
      return NextResponse.json(JSON.parse(jsonStr));
    } catch {
      return NextResponse.json({ events: [], summary: '', raw_result: searchContent });
    }

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
