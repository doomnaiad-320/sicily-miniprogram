import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: '请提供图片' }, { status: 400 })
    }

    // 构建完整 URL
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${request.headers.get('origin')}${imageUrl}`

    const response = await fetch(process.env.SILICONFLOW_BASE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.SILICONFLOW_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: fullUrl } },
              { type: 'text', text: '请识别图片中的物品，提取关键信息（物品名称、颜色、品牌、特征等），用于失物招领描述。请用简洁的中文回复。' }
            ]
          }
        ],
        max_tokens: 500,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || '识别失败')
    }

    const result = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Recognize error:', error)
    return NextResponse.json({ error: '识别失败' }, { status: 500 })
  }
}
