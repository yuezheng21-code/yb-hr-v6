# 渊博+579 HR V7

完整的人力派遣管理系统 — FastAPI 后端 + React 前端，支持 Railway / Docker 一键部署。

## 功能模块

| 模块 | 说明 |
|------|------|
| 📊 仪表盘 | 实时数据总览，Zeitkonto/Abmahnung 预警 |
| 👥 员工花名册 | 增删改查，P1-P9职级，多仓库，多来源 |
| ⏱️ 工时记录 | 三级审批（提交→仓库→财务），批量审批 |
| ⏳ Zeitkonto | 时间账户，§4 ArbZG 合规预警，Freizeitausgleich |
| ⚠️ Abmahnung | 书面警告管理，自动生成德文信件，Kündigung风险预警 |
| 📋 Werkvertrag | 8阶段全流程（立项→测算→报价→合规→备人→培训→运营→撤离） |
| 📦 卸柜记录 | 开柜记录，视频确认，HGB §438 合规 |
| 🏗️ 作业记录 | 第三方劳务作业产量：班组录入 / 工人报工 / 扫码工位 / 马帮·领星·易仓 文件导入 / WMS API 推送，可独立运行也可接入仓储系统 |
| 🏆 绩效看板 | 工效标准法效率%、质量分、综合分 A–D，按员工/劳务供应商/作业/客户/仓库/日期排名，计件金额 — 详见 [docs/作业记录与绩效模块.md](docs/作业记录与绩效模块.md) |
| 💰 月度结算 | 按员工×仓库自动汇总，自有/供应商分离 |
| ⏰ 打卡 | 工人PIN入口，上/下班打卡 |
| 📝 审计日志 | 所有操作完整记录 |
| 📈 甲方运营看板 | 给仓库方（甲方）开只读账号，只看绑定仓库的作业工时、效率、差错、装卸柜、质量事件和预估结算额；不含员工个人信息、工资和供应商成本 |
| 🖥️ 后台看板 | 管理员总览：账号与活跃度、待处理事项、数据概况、安全与配置健康检查 |
| 👤 用户管理 | 独立页面：搜索/按角色筛选、侧边抽屉编辑角色、绑定仓库/供应商、打卡 PIN、停用恢复 |
| ⚙️ 系统设置 | 薪资成本参数、ArbZG/Zeitkonto 合规阈值 |

## 快速部署：Railway（推荐）

### 第一次部署（约 5 分钟）

1. 登录 [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**，选择本仓库。
   Railway 读取 `railway.toml`，用仓库里的 `Dockerfile` 构建（Node 构建前端 → Python 运行后端），无需额外配置。
2. 在同一项目里 **+ New → Database → PostgreSQL**。
3. 打开应用服务 → **Variables**，添加：
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`（引用变量，Railway 会自动填入连接串）
   - `JWT_SECRET` = 32 位以上随机串（如 `openssl rand -hex 32` 的输出）
   - `ADMIN_PASSWORD` = admin 账号的初始密码
   - `CORS_ORIGINS` = 你的访问域名（如 `https://xxx.up.railway.app`）
4. **Settings → Networking → Generate Domain** 获取访问地址。
5. 部署完成后打开域名，用 `admin` + `ADMIN_PASSWORD` 登录，进入 **后台看板** 查看「系统健康」，所有项应为 ✓。

> 首次启动会自动建表与写入初始数据（约 1–3 分钟），期间页面显示「系统正在启动」；
> `/health` 始终返回 200，Railway 健康检查不会因数据库初始化而失败。

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接串（`postgres://` / `postgresql://` 均可） | 空（使用 SQLite，仅限本地开发） |
| `PORT` | 服务端口（Railway 自动设置） | `8000` |
| `JWT_SECRET` | **生产必须设置** — 不设置则每次重启/重新部署后所有用户需重新登录 | 每次启动随机生成 |
| `ADMIN_PASSWORD` | 首次部署时 admin 账号的初始密码（之后在「用户管理」修改） | `admin123` |
| `CORS_ORIGINS` | 允许的前端域名，逗号分隔 | `*`（全放行，仅开发用） |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 登录有效期初始值（之后以「系统设置 → 会话超时」为准） | `480` |
| `FORCE_RESEED` | 设为 `1` 则每次启动重置所有默认账号密码（**仅测试环境**） | 空 |

> **生产部署清单：**
> 1. 设置强随机 `JWT_SECRET`
> 2. 设置 `ADMIN_PASSWORD`，首次登录后在「用户管理」修改其他默认账号（hr/finance/…）的密码或停用它们
> 3. 设置 `CORS_ORIGINS` 为实际域名
> 4. `DATABASE_URL` 指向 PostgreSQL；系统设置、用户、业务数据都存在数据库里，重新部署不会丢失
> 5. 登录接口带失败限流（同一来源 15 分钟内失败 10 次即临时锁定），工人 PIN 也受保护

---

## Docker 部署

```bash
# 构建并启动
docker build -t hr-v7 .
docker run -d -p 8000:8000 -v $(pwd)/data:/app/data hr-v7

# 访问
open http://localhost:8000
```

---

## 本地开发

### 后端

```bash
pip install -r requirements.txt
python -c "import backend.database as d; d.init_db(); d.seed_data()"  # 初始化数据库 + 插入示例数据
uvicorn backend.main:app --reload --port 8000
# 后端运行在 http://localhost:8000
```

### 前端（React + Vite，推荐开发时使用）

```bash
cd frontend
npm install          # 仅第一次需要
npm run dev          # 启动开发服务器 → http://localhost:5173
```

> **联调说明**：`vite.config.js` 已配置 `/api` 和 `/health` 代理到 `http://localhost:8000`，
> 前端开发时无需修改后端跨域配置，直接联调即可。

### 前端生产构建

```bash
cd frontend
npm run build        # 输出到 frontend/dist/
```

> **生产部署**：Dockerfile 会自动执行 `npm ci && npm run build`，
> `backend/main.py` 优先挂载 `frontend/dist/`（Vite构建产物）作为静态资源，
> 若不存在则回退到 `static/`（legacy）。

> **legacy 说明**：`static/` 目录保留为历史参考，不再作为主实现。
> 主前端实现位于 `frontend/`。

### 导出功能

工时记录和月度结算支持 CSV 导出：

| 端点 | 说明 |
|---|---|
| `GET /api/timesheets/export` | 导出工时记录（支持 status/date_from/date_to/warehouse 筛选） |
| `GET /api/settlement/monthly/export?month=YYYY-MM` | 导出指定月份结算汇总 |

前端"工时记录"和"月度结算"页面均有 **↓ CSV** 按钮。

---

## 默认账号

### 管理后台（用户名 + 密码）

| 用户名 | 密码 | 角色 | 权限说明 |
|--------|------|------|---------|
| admin | admin123 | 管理员 | 全部功能 |
| hr | hr123 | HR经理 | 员工/工时/报价/派遣管理 |
| finance | fin123 | 财务 | 工时审批/月度结算 |
| wh_una | una123 | 仓库管理(UNA) | UNA仓库相关操作 |
| sup001 | sup123 | 供应商 | 仅查看自己名下员工 |
| mgr | mgr123 | 运营经理 | 运营数据查看 |
| worker01 | worker123 | 工人 | 打卡入口（也可用PIN登录）|

### 工人打卡（PIN 登录）

| PIN | 对应账号 | 姓名 |
|-----|---------|------|
| 1001 | worker01 | 张三 |

> **提示**：登录页面底部显示所有测试账号，可直接复制使用。

---

## API 文档

启动后访问 `http://localhost:8000/docs` 查看完整 Swagger API 文档。

## 项目结构

```
hr-v7/
├── frontend/                    # ★ React + Vite 前端（主实现）
│   ├── index.html               # HTML 入口（含完整 CSS 主题）
│   ├── vite.config.js           # Vite 配置（/api 代理 → 后端 8000）
│   ├── package.json
│   └── src/
│       ├── main.jsx             # React 根，挂载所有 Provider
│       ├── App.jsx              # 主布局：侧边栏 + 路由渲染 + 健康检测
│       ├── router/
│       │   └── index.jsx        # NAV_ITEMS 路由表（含角色权限）
│       ├── services/
│       │   ├── api.js           # 统一 fetch 客户端（401 守卫、健康轮询）
│       │   └── auth.js          # 登录/PIN/登出/localStorage 持久化
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── LangContext.jsx  # 多语言（zh/en/de/ar）+ LangSwitcher
│       │   └── ToastContext.jsx # Toast 通知（2500ms）
│       ├── i18n/index.js        # I18N 翻译字符串
│       ├── components/
│       │   ├── Modal.jsx
│       │   ├── Spinner.jsx
│       │   └── StatusBadge.jsx
│       └── pages/
│           ├── Login.jsx        # 管理员账号 + 工人PIN 双入口
│           ├── Dashboard.jsx    # KPI 卡片 + 7日工时图
│           ├── Attendance.jsx   # 员工花名册（CRUD）
│           ├── Timesheets.jsx   # 工时记录（三级审批）
│           ├── Schedules.jsx    # Zeitkonto + Freizeitausgleich
│           ├── Clock.jsx        # 工人打卡
│           ├── Settlements.jsx  # 月度结算
│           ├── Containers.jsx   # 卸柜记录
│           ├── Quotations.jsx   # Werkvertrag 项目（8阶段）
│           ├── Referrals.jsx    # Abmahnung 警告 + 德文信件
│           ├── Commissions.jsx  # 职级薪酬 + 成本测算
│           ├── Suppliers.jsx
│           ├── WarehouseRates.jsx
│           └── AuditLogs.jsx
├── backend/
│   ├── __init__.py
│   ├── main.py         # FastAPI 主入口，lifespan、中间件、挂载所有路由
│   ├── config.py       # 配置（DATABASE_URL、PORT 等）
│   ├── database.py     # 数据库 schema + 示例数据（PostgreSQL/SQLite 自动切换）
│   ├── deps.py         # 共享依赖（Token 存储、get_user、DB 辅助函数）
│   └── routers/
│       ├── auth.py         # 登录、PIN 登录、登出
│       ├── analytics.py    # 仪表盘
│       ├── employees.py    # 员工花名册
│       ├── timesheets.py   # 工时记录 + 审批
│       ├── zeitkonto.py    # 时间账户
│       ├── abmahnung.py    # 书面警告
│       ├── werkvertrag.py  # 工程合同
│       ├── containers.py   # 卸柜记录
│       ├── warehouses.py   # 仓库/供应商/职级/薪资
│       ├── settlement.py   # 月度结算
│       ├── clock.py        # 打卡
│       └── logs.py         # 审计日志
├── app.py              # 兼容入口（re-exports backend.main:app）
├── database.py         # 兼容入口（re-exports backend.database）
├── static/             # ⚠ legacy — 单文件 React（保留备用，不再主动维护）
│   └── index.html
├── uploads/            # 文件上传目录
│   └── .gitkeep
├── requirements.txt
├── Procfile            # Railway 启动命令（→ backend.main:app）
├── railway.toml        # Railway 配置
├── Dockerfile
└── .gitignore
```
