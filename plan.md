校园失物招领（微信小程序 + Node 后台管理）计划文档

更新时间：2025-12-14

## 1. 项目概述
- 目标：实现一套“失物/招领”微信小程序 + 后台管理 + Node 后端，流程完整、UI 简约精美，适合毕业设计演示。
- 范围：小程序端（登录、发布、展示、留言、我的发布）、后台管理端（管理员登录、用户/分类/信息审核与发布）、后端服务（鉴权、存储、识别、位置）。
- 非目标：即时通讯、支付/积分、复杂风控、多角色权限矩阵等。

## 2. 需求清单
- 小程序端：微信登录；发布失物/招领（必须多图，建议 2–9 张）；分类选择；定位 + 手填“在哪里丢/捡到”；描述；手机号（展示时脱敏）；公开留言区；卡片流展示；详情页；我的发布（含审核状态与拒绝理由）。
- 后台端：管理员登录；用户管理（启用/禁用/删除，可见头像/昵称）；分类 CRUD；信息审核（待审核/通过/拒绝/下架，拒绝必须填理由）；后台也可发布；基础列表搜索/筛选/分页。
- 识别：发布时拍照/选图后自动识别物品属性/品类，返回“推荐分类 + 关键词标签”，失败兜底不阻塞发布。
- 存储/位置：图片本地存储；发布需定位 + 位置描述。

## 3. 关键决策记录
- 信息类型：失物 / 招领
- 联系方式：手机号脱敏展示；留言为所有人可见评论区
- 审核状态：待审核 / 通过 / 拒绝 / 下架（拒绝需理由）
- 角色：仅管理员（无审核员区分）
- 识别类型：物品属性/品类识别（非文字 OCR）
- 图片存储：服务器本地
- 数据库：开发 SQLite；生产 MySQL 5.6
- 位置：定位 + 手填位置描述
- 发布：必须多图（建议 2–9 张）
- 识别输出：推荐分类 + 标签/属性（可为空）

## 4. 核心业务流程
1) 小程序微信登录 → 后端 jscode2session 获取 openid → 颁发自定义 token  
2) 用户发布：多图上传 → 识别推荐分类/标签 → 填写类型/分类/位置/描述/手机号 → 提交 → 状态=待审核  
3) 管理员审核：通过 / 拒绝（必填理由） / 下架；后台可直接发布  
4) 前端展示：卡片列表（筛选/搜索/分页）→ 详情页（脱敏手机号、位置、标签、多图）→ 公开留言  
5) 我的发布：查看状态与拒绝理由，必要时重新编辑提交（若实现重审）

## 5. 数据模型草案
- User：id, openid, nickname, avatar, status, createdAt, lastLoginAt
- Admin：id, username, passwordHash, createdAt, lastLoginAt
- Category：id, name, sort, enabled, createdAt, updatedAt
- Post：id, type(失物/招领), title?, description, categoryId, images[], location{lat,lng,address,text}, contactPhone, status(待审/通过/拒绝/下架), rejectReason?, tags[], createdByUserId?, createdByAdminId?, createdAt, updatedAt
- Comment：id, postId, userId, content, createdAt, isDeleted
- AuditRecord（可选）：id, postId, adminId, action(通过/拒绝/下架), reason, createdAt

状态机：待审核 → 通过 / 拒绝；通过 → 下架；拒绝后可允许编辑再审（视实现取舍）。

## 6. 接口草案
- 小程序：`POST /auth/wechat-login`；`GET /categories`；`GET /posts`；`GET /posts/:id`；`POST /posts`；`PATCH /posts/:id`；`DELETE /posts/:id`；`GET /me/posts`；`POST /upload`；`POST /recognize`（返回推荐分类/标签）；`GET/POST /posts/:id/comments`
- 后台：`POST /admin/auth/login`；`GET/PUT/DELETE /admin/users`；`GET/POST/PUT/DELETE /admin/categories`；`GET /admin/posts`；`POST /admin/posts`；`PATCH /admin/posts/:id/status`（通过/拒绝/下架，拒绝需理由）；`DELETE /admin/comments/:id`

## 7. 识别方案
- 输入：用户上传的物品图片（多图可取首张或全部打分）
- 输出：推荐分类 + 标签/属性；可为空
- 实现：优先本地模型（如轻量 ONNX/TFJS 的通用物体标签）；如需更高精度可切换云端标签服务（需密钥）
- 兜底：识别超时/失败时返回空结果，不影响发布；提供“重新识别”按钮

## 8. 存储与环境
- 图片：本地目录存储，静态资源 URL 可配置；限制单图大小与总数
- 数据库：开发 SQLite；生产 MySQL 5.6；用 Prisma 迁移保证兼容（数组/JSON 可用关联表或文本）
- 配置：微信 appid/secret、JWT secret、上传大小、识别开关/模型路径、静态资源前缀

## 9. 里程碑计划
- M1 需求锁定与数据模型确定；完成本计划文档
- M2 后端骨架 + 鉴权 + 数据迁移（SQLite）+ 核心表；健康检查
- M3 后端核心接口：登录/上传/分类/信息发布+列表+详情/留言；管理员用户管理 + 审核/下架/后台发布
- M4 小程序端：TabBar（首页/发布/我的）；列表筛选/搜索；发布多图+定位+描述+识别推荐；详情+留言；我的发布状态
- M5 后台端：登录；用户列表（启用/禁用/删除）；分类 CRUD；信息审核/下架；后台发布；列表筛选/分页
- M6 识别接入与兜底；配置限流/缓存；部署文档（SQLite→MySQL5.6 迁移、静态资源、环境变量）

## 10. 风险与待确认
- 识别精度与模型大小的取舍：若本地模型精度不足需云服务与密钥
- 微信登录需真实 appid/secret；生产需合法域名与 https
- MySQL 5.6 对 JSON/数组支持有限，需以关联表或文本字段实现
- 定位授权可能被拒：需友好引导与手动输入兜底
