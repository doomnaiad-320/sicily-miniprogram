import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface RecognitionResult {
  suggestedCategoryName?: string;
  labels?: string[];
  attributes?: Record<string, string | null>;
  extractedText?: string | null;
  confidence?: number;
  provider: string;
  raw?: any;
}

@Injectable()
export class RecognitionService {
  constructor(private readonly config: ConfigService) {}

  /**
   * 调用 SiliconFlow DeepSeek-OCR 获取分类/标签
   */
  async recognize(imageUrl: string): Promise<RecognitionResult> {
    const apiKey = this.config.get<string>('SILICONFLOW_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('未配置识别服务密钥');
    }

    const model = this.config.get<string>('SILICONFLOW_MODEL') || 'deepseek-ai/DeepSeek-OCR';
    const baseURL =
      this.config.get<string>('SILICONFLOW_BASE_URL') ||
      'https://api.siliconflow.cn/v1/chat/completions';

    const messages = [
      {
        role: 'system',
        content:
          '你是一个物品识别助手，请根据图片返回严格 JSON，字段：suggestedCategoryName(字符串)，labels(字符串数组)，attributes(对象，可包含color/brand/material等，可为空)，extractedText(字符串或null)，confidence(0-1 数值)。不要输出多余文字。',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: '识别图片中的物品，返回 JSON。' },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
    ];

    try {
      const { data } = await axios.post(
        baseURL,
        {
          model,
          messages,
          stream: false,
          temperature: 0,
          response_format: { type: 'json_object' },
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const text = data?.choices?.[0]?.message?.content;
      if (!text) {
        return { provider: 'deepseek', raw: data };
      }

      const parsed = JSON.parse(text);
      return {
        suggestedCategoryName: parsed.suggestedCategoryName,
        labels: parsed.labels,
        attributes: parsed.attributes,
        extractedText: parsed.extractedText,
        confidence: parsed.confidence,
        provider: 'deepseek',
        raw: data,
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('识别调用失败', error?.response?.data || error.message);
      throw new InternalServerErrorException('识别服务调用失败');
    }
  }
}
