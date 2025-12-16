# Sicily 校园失物招领系统

一个完整的校园失物招领平台，包含微信小程序前端和 Next.js 管理后台，帮助校园师生快速发布和找回丢失物品。

## 项目概述

Sicily 校园失物招领系统是一个全栈项目，旨在为校园提供便捷的失物招领服务。用户可以通过微信小程序发布失物或招领信息，管理员可以通过后台系统进行信息审核和数据管理。

### 核心功能

- **失物发布** - 用户可发布丢失物品信息，包含图片、描述、地点等
- **招领发布** - 用户可发布拾获物品信息，等待失主认领
- **智能识别** - AI 自动识别物品图片，智能推荐分类
- **实时消息** - 用户间可通过私信功能沟通联系
- **信息审核** - 管理员审核发布内容，确保信息真实有效
- **数据统计** - 可视化仪表盘展示平台运营数据

## 项目结构

```
sicily-miniprogram/
├── miniprogram-5/          # 微信小程序前端
│   ├── pages/              # 页面文件
│   │   ├── home/           # 首页 - 信息列表
│   │   ├── release/        # 发布页 - 发布失物/招领
│   │   ├── message/        # 消息页 - 会话列表
│   │   ├── chat/           # 聊天页 - 私信对话
│   │   └── my/             # 我的页 - 个人中心
│   ├── components/         # 公共组件
│   ├── api/                # API 请求封装
│   └── static/             # 静态资源
│
├── admin/                  # Next.js 管理后台
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   │   ├── api/        # API 路由
│   │   │   └── (main)/     # 页面路由
│   │   │       └── dashboard/
│   │   │           ├── default/   # 仪表盘
│   │   │           ├── posts/     # 信息管理
│   │   │           ├── users/     # 用户管理
│   │   │           └── categories/# 分类管理
│   │   ├── components/     # UI 组件
│   │   └── lib/            # 工具函数
│   └── prisma/             # 数据库配置
│
└── server/                 # 旧版后端（已弃用）
```

## 技术栈

### 微信小程序 (miniprogram-5)

| 技术 | 说明 |
|------|------|
| 微信小程序原生 | 基础框架 |
| TDesign | 腾讯出品的 UI 组件库 |
| Less | CSS 预处理器 |
| JavaScript | 编程语言 |

### 管理后台 (admin)

| 技术 | 说明 |
|------|------|
| Next.js 16 | React 全栈框架 |
| React 19 | 前端框架 |
| TypeScript | 类型安全 |
| Tailwind CSS 4 | 原子化 CSS |
| Radix UI + shadcn/ui | UI 组件库 |
| Prisma | 数据库 ORM |
| SQLite | 数据库（可切换） |
| Recharts | 数据可视化 |
| Zustand | 状态管理 |
| React Hook Form + Zod | 表单验证 |

## 环境要求

- **Node.js** >= 18.17.0
- **npm** >= 9.0.0
- **微信开发者工具** >= 1.06.0
- **Git**

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd sicily-miniprogram
```

### 2. 启动管理后台

```bash
# 进入后台目录
cd admin

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库和密钥

# 初始化数据库
npm run db:generate
npm run db:push
npm run db:seed

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 进入管理后台

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

### 3. 启动微信小程序

```bash
# 进入小程序目录
cd miniprogram-5

# 安装依赖
npm install
```

1. 打开微信开发者工具
2. 导入 `miniprogram-5` 目录
3. 点击「工具」→「构建 npm」
4. 修改 `config/index.js` 中的 `baseUrl` 为后台地址
5. 点击「编译」预览小程序

## 环境变量配置

在 `admin/.env` 文件中配置：

```env
# 数据库
DATABASE_URL="file:./dev.db"

# JWT 密钥
JWT_SECRET="your-admin-jwt-secret"
JWT_USER_SECRET="your-user-jwt-secret"

# 管理员账号
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# 微信小程序配置
WECHAT_APPID="your-wechat-appid"
WECHAT_SECRET="your-wechat-secret"

# AI 识别服务（可选）
SILICONFLOW_API_KEY="your-api-key"
SILICONFLOW_BASE_URL="https://api.siliconflow.cn/v1/chat/completions"
SILICONFLOW_MODEL="deepseek-ai/DeepSeek-OCR"
```

## 功能截图

### 小程序端

| 首页 | 发布 | 消息 | 我的 |
|:----:|:----:|:----:|:----:|
| 信息流列表 | 发布失物/招领 | 会话列表 | 个人中心 |

### 管理后台

| 仪表盘 | 信息管理 | 用户管理 |
|:------:|:--------:|:--------:|
| 数据统计图表 | 审核/下架信息 | 用户列表管理 |

## API 文档

### 认证接口
- `POST /api/auth/login` - 管理员登录
- `POST /api/auth/wechat-login` - 微信小程序登录
- `GET /api/auth/me` - 获取当前用户信息

### 信息接口
- `GET /api/posts` - 获取信息列表
- `POST /api/posts` - 创建信息
- `GET /api/posts/[id]` - 获取信息详情
- `PUT /api/posts/[id]/status` - 更新审核状态
- `PUT /api/posts/[id]/close` - 关闭信息（已找回/已认领）

### 用户接口
- `GET /api/users` - 获取用户列表
- `GET /api/me/posts` - 获取我的发布

### 消息接口
- `GET /api/conversations` - 获取会话列表
- `GET /api/conversations/[id]/messages` - 获取消息记录

### 其他接口
- `GET /api/categories` - 获取分类列表
- `POST /api/upload` - 上传图片
- `POST /api/recognize` - AI 图片识别
- `GET /api/stats` - 获取统计数据

## 部署指南

### 后台部署

#### Docker 部署

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Vercel 部署

1. Fork 本项目到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量（注意：需使用云数据库替换 SQLite）
4. 部署完成

### 小程序发布

1. 在微信开发者工具中点击「上传」
2. 登录微信公众平台提交审核
3. 审核通过后发布上线

## 开发命令

### 管理后台

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run format       # 代码格式化
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 推送数据库结构
npm run db:seed      # 初始化种子数据
```

### 小程序

```bash
npm install          # 安装依赖
# 在微信开发者工具中构建 npm
```

## 常见问题

### Q: 小程序无法连接后台？
A: 检查 `miniprogram-5/config/index.js` 中的 `baseUrl` 是否正确配置，开发环境需要在微信开发者工具中勾选「不校验合法域名」。

### Q: 上传图片失败？
A: 确保 `admin/public/uploads` 目录存在且有写入权限。

### Q: AI 识别功能不工作？
A: 需要在 `.env` 中配置有效的 `SILICONFLOW_API_KEY`。

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 致谢

- [TDesign](https://tdesign.tencent.com/) - 腾讯出品的企业级设计体系
- [shadcn/ui](https://ui.shadcn.com/) - 精美的 React 组件库
- [Next.js](https://nextjs.org/) - React 全栈框架
- [Prisma](https://www.prisma.io/) - 现代化数据库工具包
