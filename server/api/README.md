# 校园失物招领 - 后端（NestJS + Prisma）

## 快速开始（开发：SQLite）

```bash
cd server/api
cp .env.example .env           # 填入微信/DeepSeek/key 等
npm install                    # 安装依赖
npx prisma generate            # 生成 Prisma Client
npx prisma migrate dev --name init # 初始化 SQLite 表
npm run start:dev              # 启动开发服务（默认 3000）
```

## 环境变量
- `DATABASE_URL`：开发默认 `file:../dev.db`（SQLite），生产改成 MySQL 5.6 连接串并将 `provider` 改为 `mysql`
- `JWT_USER_SECRET` / `JWT_ADMIN_SECRET`：JWT 密钥
- `WECHAT_APPID` / `WECHAT_SECRET`：微信登录参数
- `ADMIN_DEFAULT_USERNAME` / `ADMIN_DEFAULT_PASSWORD`：首次启动自动创建管理员
- `UPLOAD_DIR`：本地上传目录
- `SILICONFLOW_*`：DeepSeek OCR 调用配置

## 路由速览
- 用户登录：`POST /api/auth/wechat-login`
- 获取分类：`GET /api/categories`
- 发布信息：`POST /api/posts`（需要用户 token）
- 信息列表/详情：`GET /api/posts` / `GET /api/posts/:id`
- 留言：`GET/POST /api/posts/:id/comments`
- 我的发布：`GET /api/me/posts`
- 上传：`POST /api/upload`
- 识别：`POST /api/recognize`
- 管理端：`POST /api/admin/auth/login`、`/api/admin/categories`、`/api/admin/posts` 等

## 生产 MySQL 5.6 注意事项
1. 将 `prisma/schema.prisma` 的 `provider` 改为 `mysql`
2. 设置 `DATABASE_URL="mysql://user:pwd@host:3306/dbname"`
3. 运行 `npx prisma generate && npx prisma migrate deploy`
4. 静态资源（上传目录）建议通过 Nginx 代理 `/uploads`
