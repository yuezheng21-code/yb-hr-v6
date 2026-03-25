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
| 💰 月度结算 | 按员工×仓库自动汇总，自有/供应商分离 |
| ⏰ 打卡 | 工人PIN入口，上/下班打卡 |
| 📝 审计日志 | 所有操作完整记录 |

## 快速部署：Railway（推荐）

### 第一次部署（约5分钟）

1. **Fork 本仓库**到你的 GitHub 账号

2. 登录 [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**

3. 选择 fork 的仓库，Railway 自动识别 Python 项目

4. 点击 **Deploy** — 等待2-3分钟，绿色 ✅ = 部署成功

5. 点击 **Settings → Domains** → **Generate Domain** 获取访问地址

### 环境变量（可选）

在 Railway → Variables 中设置：
```
DB_PATH=/app/data/hr_v7.db    # 数据库路径（默认当前目录）
PORT=8000                      # 端口（Railway自动设置）
```

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

| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 全部 |
| hr | hr123 | HR经理 | 员工/工时/Abmahnung/Werkvertrag |
| wh_una | una123 | 仓库(UNA) | 仓库相关 |
| finance | fin123 | 财务 | 工时审批/结算 |
| mgr579 | 579pass | 579经理 | 579业务线 |
| sup001 | sup123 | 供应商 | 仅自己的员工 |
| worker | w123 | 工人 | 打卡（或用PIN）|

工人PIN: 1001(张三) 1002(李四) 1003(王五) 1004(阮氏花)

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
