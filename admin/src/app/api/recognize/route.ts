import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: '请提供图片URL' }, { status: 400 })
    }

    const apiKey = process.env.SILICONFLOW_API_KEY
    const baseUrl = process.env.SILICONFLOW_BASE_URL
    const model = process.env.SILICONFLOW_MODEL

    if (!apiKey || !baseUrl) {
      return NextResponse.json({
        category: null,
        tags: [],
        message: '识别服务未配置'
      })
    }

    const fullImageUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${imageUrl}`

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-ai/DeepSeek-OCR',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: fullImageUrl }
              },
              {
                type: 'text',
                text: '请识别图片中的物品，返回JSON格式：{"category": "物品分类（如：电子产品、证件、钥匙、钱包、书籍、衣物、其他）", "tags": ["标签1", "标签2"], "description": "简短描述"}。只返回JSON，不要其他内容。'
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      console.error('Recognition API error:', await response.text())
      return NextResponse.json({
        category: null,
        tags: [],
        message: '识别服务暂时不可用'
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          category: result.category || null,
          tags: result.tags || [],
          description: result.description || '',
        })
      }
    } catch {
      console.error('Parse recognition result error')
    }

    return NextResponse.json({
      category: null,
      tags: [],
      message: '无法识别物品'
    })
  } catch (error) {
    console.error('Recognize error:', error)
    return NextResponse.json({
      category: null,
      tags: [],
      message: '识别失败'
    })
  }
}
