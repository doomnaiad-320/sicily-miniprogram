# Sicily 校园失物招领管理后台

一个现代化的校园失物招领系统管理后台，基于 Next.js 16 构建，提供完整的信息管理、用户管理、数据统计等功能。

## 项目特点

- **现代化技术栈** - 基于 Next.js 16 + React 19 + TypeScript 构建
- **美观的UI设计** - 采用 Tailwind CSS 4 + Radix UI + shadcn/ui 组件库
- **丰富的数据可视化** - 使用 Recharts 实现多维度数据图表展示
- **完整的权限管理** - JWT 认证，支持管理员和用户双角色
- **微信小程序对接** - 提供完整的小程序 API 接口
- **AI 智能识别** - 集成硅基流动 AI 服务，支持图片智能识别分类
- **响应式设计** - 完美适配桌面端和移动端

## 技术栈

### 前端框架
- **Next.js 16** - React 全栈框架，支持 App Router
- **React 19** - 最新版 React，支持 React Compiler
- **TypeScript 5** - 类型安全的 JavaScript 超集

### UI 组件
- **Tailwind CSS 4** - 原子化 CSS 框架
- **Radix UI** - 无障碍 UI 原语组件
- **shadcn/ui** - 精美的可定制组件库
- **Lucide React** - 精美的图标库
- **Recharts** - 数据可视化图表库

### 数据管理
- **Prisma** - 现代化 ORM 框架
- **SQLite** - 轻量级数据库（可切换 PostgreSQL/MySQL）
- **Zustand** - 轻量级状态管理
- **TanStack Query** - 服务端状态管理
- **React Hook Form + Zod** - 表单处理与验证

### 开发工具
- **Biome** - 快速的代码格式化和 Lint 工具
- **Husky + lint-staged** - Git Hooks 自动化
- **ts-node** - TypeScript 脚本执行

## 功能模块

### 仪表盘
- 数据概览卡片（用户数、信息数、找回率等）
- 信息状态分布饼图
- 失物/招领类型分布图
- 近7日趋势折线图
- 分类统计柱状图

### 信息管理
- 失物/招领信息列表
- 信息审核（通过/拒绝/下架）
- 信息详情查看
- 信息状态管理（进行中/已找回/已认领）

### 用户管理
- 用户列表查看
- 用户状态管理

### 分类管理
- 分类增删改查
- 分类排序
- 分类启用/禁用

## 环境要求

- **Node.js** >= 18.17.0
- **npm** >= 9.0.0 或 **pnpm** >= 8.0.0
- **Git**

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd admin
```

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下环境变量：

```env
# 数据库连接
DATABASE_URL="file:./dev.db"

# JWT 密钥（生产环境请使用强密钥）
JWT_SECRET="your-admin-jwt-secret"
JWT_USER_SECRET="your-user-jwt-secret"

# 默认管理员账号
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# 微信小程序配置
WECHAT_APPID="your-wechat-appid"
WECHAT_SECRET="your-wechat-secret"

# 硅基流动 AI 识别服务（可选）
SILICONFLOW_API_KEY="your-api-key"
SILICONFLOW_BASE_URL="https://api.siliconflow.cn/v1/chat/completions"
SILICONFLOW_MODEL="deepseek-ai/DeepSeek-OCR"
```

### 4. 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库结构
npm run db:push

# 初始化种子数据（管理员账号、默认分类）
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可看到登录页面。

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123`

## 生产部署

### 方式一：Node.js 直接部署

```bash
# 构建项目
npm run build

# 启动生产服务
npm run start
```

### 方式二：Docker 部署

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

### 方式三：Vercel 部署

1. 将项目推送到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署完成

> 注意：Vercel 部署需要使用云数据库（如 PlanetScale、Supabase）替换 SQLite

## 项目结构

```
admin/
├── prisma/                # Prisma 数据库配置
│   ├── schema.prisma      # 数据模型定义
│   └── seed.ts            # 种子数据脚本
├── public/                # 静态资源
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (main)/        # 主要页面
│   │   │   ├── auth/      # 认证页面
│   │   │   └── dashboard/ # 仪表盘页面
│   │   └── api/           # API 路由
│   ├── components/        # 通用组件
│   │   └── ui/            # UI 组件库
│   ├── hooks/             # 自定义 Hooks
│   ├── lib/               # 工具函数
│   └── stores/            # Zustand 状态
├── .env                   # 环境变量
├── package.json           # 项目配置
└── tailwind.config.ts     # Tailwind 配置
```

## API 接口

### 认证相关
- `POST /api/auth/login` - 管理员登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/wechat-login` - 微信小程序登录

### 信息管理
- `GET /api/posts` - 获取信息列表
- `POST /api/posts` - 创建信息
- `GET /api/posts/[id]` - 获取信息详情
- `PUT /api/posts/[id]` - 更新信息
- `PUT /api/posts/[id]/status` - 更新审核状态
- `PUT /api/posts/[id]/close` - 关闭信息
- `PUT /api/posts/[id]/reopen` - 重新开放信息

### 用户管理
- `GET /api/users` - 获取用户列表

### 分类管理
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类

### 统计数据
- `GET /api/stats` - 获取仪表盘统计数据

## 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器

# 构建
npm run build        # 构建生产版本
npm run start        # 启动生产服务器

# 代码质量
npm run lint         # 运行 Lint 检查
npm run format       # 格式化代码
npm run check        # 检查代码问题
npm run check:fix    # 自动修复代码问题

# 数据库
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 推送数据库结构
npm run db:seed      # 初始化种子数据
```

## 许可证

MIT License
