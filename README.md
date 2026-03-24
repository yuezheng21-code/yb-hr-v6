# 渊博+579 HR V6

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
DB_PATH=/app/data/hr_v6.db    # 数据库路径（默认当前目录）
PORT=8000                      # 端口（Railway自动设置）
```

---

## Docker 部署

```bash
# 构建并启动
docker build -t hr-v6 .
docker run -d -p 8000:8000 -v $(pwd)/data:/app/data hr-v6

# 访问
open http://localhost:8000
```

---

## 本地开发

```bash
pip install -r requirements.txt
python -c "import backend.database as d; d.init_db(); d.seed_data()"  # 初始化数据库 + 插入示例数据
uvicorn backend.main:app --reload --port 8000
# 访问 http://localhost:8000
```

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
hr-v6/
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
├── static/
│   └── index.html      # React 前端（单文件，连接后端 API）
├── uploads/            # 文件上传目录
│   └── .gitkeep
├── requirements.txt
├── Procfile            # Railway 启动命令（→ backend.main:app）
├── railway.toml        # Railway 配置
├── Dockerfile
└── .gitignore
```
