# 渊博579 人力派遣管理系统 V7.0 — Agent 构建指导书

> **用途**：本文档是面向 AI coding agent 的完整构建规范。Agent 应严格按照本文档中的数据库 schema、API 设计、业务规则和实施顺序来构建系统。
> **业务背景**：德国 NRW/Ruhr 地区第三方海外仓人力派遣公司，两个主体：Yuan-Bo GmbH (Werkvertrag) + Rental 579 GmbH (AÜG)，管理 10 个仓库、200+ 仓库工人、5 个供应商团队。

---

## 一、技术栈（不可更改）

| 层 | 技术 | 版本要求 |
|---|---|---|
| 前端框架 | React 18 | ≥18.2 |
| 构建工具 | Vite | ≥5.0 |
| CSS | TailwindCSS | ≥3.4 |
| 状态管理 | Zustand | ≥4.5 |
| 路由 | React Router | v6 |
| i18n | react-i18next | 8语言: zh/en/de/tr/ar/hu/vi/pl |
| 后端 | Python FastAPI | ≥0.110 |
| ORM | SQLAlchemy | 2.0+ (Mapped 类型注解) |
| 数据校验 | Pydantic | v2 |
| 数据库 | PostgreSQL (生产) / SQLite (本地) | PG ≥15 |
| 认证 | JWT (PyJWT) + bcrypt | |
| 部署 | Docker + Railway | GitHub push 自动部署 |
| 导出 | openpyxl (Excel) + reportlab (PDF) | |

---

## 二、项目目录结构（Agent 必须严格遵循）

```
yuanbo-hr/
├── backend/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app 入口, lifespan 异步初始化
│   ├── config.py                  # Settings 类, 环境变量, 业务常量
│   ├── database.py                # Engine + SessionLocal + Base + get_db + init_db
│   ├── models/                    # SQLAlchemy ORM 模型 (每业务域一个文件)
│   │   ├── __init__.py            # 汇总导出所有模型
│   │   ├── user.py
│   │   ├── employee.py
│   │   ├── supplier.py
│   │   ├── warehouse.py
│   │   ├── timesheet.py
│   │   ├── container.py
│   │   ├── settlement.py          # 3张结算表
│   │   ├── dispatch.py            # 派遣需求 + 人员调度
│   │   ├── talent.py              # 人才池 + 招聘漏斗
│   │   ├── referral.py            # ★ 员工推荐奖励
│   │   ├── commission.py          # ★ 合作伙伴返佣
│   │   ├── quotation.py           # ★ 报价单 + 成本测算
│   │   └── audit.py
│   ├── schemas/                   # Pydantic v2 请求/响应模型 (与 models/ 一一对应)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── employee.py
│   │   ├── timesheet.py
│   │   ├── referral.py
│   │   ├── commission.py
│   │   ├── quotation.py
│   │   └── ...
│   ├── routers/                   # API 路由 (每业务域一个文件)
│   │   ├── __init__.py
│   │   ├── auth.py                # 登录/JWT/刷新/改密
│   │   ├── employees.py
│   │   ├── suppliers.py
│   │   ├── warehouses.py
│   │   ├── timesheets.py
│   │   ├── containers.py
│   │   ├── settlements.py
│   │   ├── dispatch.py
│   │   ├── talent.py
│   │   ├── referrals.py           # ★ 推荐奖励
│   │   ├── commissions.py         # ★ 返佣
│   │   ├── quotations.py          # ★ 报价与成本
│   │   ├── dashboard.py
│   │   └── admin.py
│   ├── services/                  # 业务逻辑层 (从 router 中抽离复杂逻辑)
│   │   ├── __init__.py
│   │   ├── settlement_calc.py     # 4种结算方式计算引擎
│   │   ├── referral_engine.py     # ★ 推荐奖励自动计算 + 防刷检测
│   │   ├── commission_engine.py   # ★ 返佣等级自动评定 + 月度核算
│   │   ├── cost_calculator.py     # ★ 成本测算引擎 (P1-P9人力成本 + 管理费)
│   │   ├── quotation_builder.py   # ★ 报价单生成 (阶梯价格 + 折扣)
│   │   ├── compliance.py          # ArbZG 合规检查 / Zeitkonto 阈值
│   │   ├── export_service.py      # PDF/Excel 导出
│   │   └── audit_service.py       # 审计日志写入
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth.py                # JWT 解析 + 角色校验 + 行级数据过滤
│   └── seed/
│       ├── __init__.py
│       └── init_data.py           # 默认数据: 7用户 + 5供应商 + 10仓库 + 价格矩阵
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                # 路由定义 + ProtectedRoute 权限守卫
│       ├── components/
│       │   ├── layout/            # AppShell / Sidebar / Header / MobileNav
│       │   ├── common/            # DataTable / Modal / FormField / Badge / StatCard / Chart
│       │   └── pages/             # 每个业务模块一个文件夹
│       │       ├── dashboard/
│       │       ├── employees/
│       │       ├── suppliers/
│       │       ├── timesheets/
│       │       ├── containers/
│       │       ├── settlements/
│       │       ├── dispatch/
│       │       ├── talent/
│       │       ├── referrals/     # ★ 推荐奖励管理页
│       │       ├── commissions/   # ★ 返佣管理页
│       │       ├── quotations/    # ★ 报价与成本页
│       │       ├── clock/
│       │       ├── messages/
│       │       └── admin/
│       ├── hooks/                 # useAuth / useFetch / usePermission / useDebounce
│       ├── services/
│       │   └── api.js             # Axios 实例 + JWT 拦截器
│       ├── i18n/                  # zh.json / en.json / de.json / tr.json / ar.json / hu.json / vi.json / pl.json
│       └── store/                 # authStore / uiStore (Zustand)
├── deploy/
│   ├── Dockerfile
│   ├── railway.toml
│   └── docker-compose.yml         # 本地开发: PG + App
├── requirements.txt
├── .env.example
└── README.md
```

---

## 三、数据库 Schema（全量 16 张表）

### 3.1 users — 用户表

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Integer | PK, auto | |
| username | String(50) | unique, not null, index | 登录名 |
| password_hash | String(200) | not null | bcrypt |
| display_name | String(100) | not null | 显示名 |
| role | String(20) | not null, default='worker' | admin/hr/fin/wh/sup/mgr/worker |
| lang | String(5) | default='zh' | 默认语言 |
| avatar_color | String(20) | default='#4f6ef7' | |
| bound_supplier_id | Integer | nullable, FK→suppliers.id | 供应商账号绑定 |
| bound_warehouse | String(10) | nullable | 仓库账号绑定 |
| bound_biz_line | String(10) | nullable | 渊博/579 |
| is_active | Boolean | default=True | |
| created_at | DateTime | default=utcnow | |
| last_login | DateTime | nullable | |

### 3.2 employees — 员工花名册

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Integer | PK | |
| emp_no | String(20) | unique, not null, index | YB-202601-001 |
| name | String(100) | not null | |
| phone | String(30) | | |
| email | String(100) | | |
| nationality | String(50) | | |
| gender | String(10) | | M/F |
| birth_date | Date | | |
| id_type | String(30) | | passport/id_card/visa |
| id_number | String(50) | | |
| **source_type** | **String(10)** | **not null, default='own'** | **★ own/supplier — 权限隔离关键字段** |
| **supplier_id** | **Integer** | **nullable, index, FK→suppliers.id** | **★ 供应商关联** |
| biz_line | String(10) | default='渊博' | 渊博/579 |
| department | String(50) | | |
| primary_warehouse | String(10) | | 主仓库代码 |
| secondary_warehouses | Text | | JSON 数组 |
| position | String(30) | | 装卸/库内/驻仓管理/组长 |
| grade | String(5) | default='P1' | P1-P9 |
| settlement_type | String(20) | default='hourly' | hourly/piece/hourly_kpi/container |
| hourly_rate | Float | | |
| languages | String(100) | | |
| skills | String(200) | | 叉车证/健康证 |
| status | String(20) | default='active' | active/inactive/reserve |
| join_date | Date | | |
| leave_date | Date | | |
| tax_id | String(30) | | DSGVO 敏感 |
| social_security_no | String(30) | | DSGVO 敏感 |
| iban | String(40) | | DSGVO 敏感 |
| health_insurance | String(50) | | |
| whatsapp | String(30) | | |
| wechat | String(50) | | |
| referrer_emp_id | Integer | nullable, FK→employees.id | ★ 推荐人员工ID |
| notes | Text | | |
| created_at | DateTime | | |
| updated_at | DateTime | | |

### 3.3 suppliers — 供应商表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Integer PK | |
| code | String(20) unique | SUP-001 |
| name | String(100) | 德信人力/Yaro团队/Oldi团队/Bobi团队/Kamal分支 |
| supplier_type | String(30) | labor/mixed |
| biz_line | String(10) | |
| contract_no | String(50) | |
| contract_start / contract_end | Date | |
| settlement_cycle | String(20) | monthly |
| contact_person / phone / email | String | |
| status | String(20) | active/suspended/terminated |
| rating | String(5) | A/B/C/D |
| notes | Text | |
| created_at | DateTime | |

### 3.4 warehouses — 仓库配置

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Integer PK | |
| code | String(10) unique | UNA/DHL/BGK/ESN/DBG/BOC/KLN/DUS/WPT/MGL |
| name | String(100) | |
| zone | String(20) | 南部/鲁尔西/鲁尔东 |
| address | String(200) | |
| manager / phone | String | |
| biz_line | String(10) | |
| client_settlement_type | String(20) | |
| rate_hourly | Float | 甲方小时单价 |
| rate_load_20gp / rate_unload_20gp | Float | 装/卸 20GP 单价 |
| rate_load_40gp / rate_unload_40gp | Float | |
| rate_45hc | Float | |
| status | String(20) | |
| notes | Text | |
| created_at | DateTime | |

### 3.5 timesheets — 工时记录 (核心表)

> 完整 schema 见上一版架构文档。关键字段：
> - ts_no (唯一), employee_id, emp_no, emp_name, source_type★, supplier_id★, biz_line
> - work_date, warehouse_code★, start_time, end_time, hours, break_minutes
> - settlement_type★ (hourly/piece/hourly_kpi/container), base_rate, pieces
> - amount_hourly/piece/kpi/bonus/deduction/total
> - container_no, container_type, load_type, group_no, is_cross_warehouse
> - approval_status (draft/wh_pending/fin_pending/booked/rejected)
> - wh_approver, wh_approved_at, fin_approver, fin_approved_at

### 3.6 container_records — 装卸柜记录

> 同上一版。关键：container_no, work_date, warehouse_code, container_type(20GP/40GP/45HC/LKW), load_type(load/unload), group_no, group_size, worker_ids(JSON), client_revenue, group_pay, split_method(equal/coefficient/hours), is_split_to_timesheet

### 3.7 employee_settlements — 自有员工月结算
### 3.8 supplier_settlements — 供应商月结算
### 3.9 project_settlements — 项目毛利分析

> 同上一版 schema。

### 3.10 dispatch_demands — 派遣需求

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Integer PK | |
| demand_no | String(20) unique | |
| biz_line | String(10) | |
| warehouse_code | String(10) | |
| position | String(30) | 需求岗位 |
| headcount | Integer | 需求人数 |
| start_date / end_date | Date | |
| shift_pattern | String(50) | 班次时间段 |
| client_settlement_type | String(20) | |
| client_rate | Float | |
| matched_count | Integer | 已匹配人数 |
| status | String(20) | open/recruiting/filled/closed |
| priority | String(10) | high/medium/low |
| requester | String(50) | |
| notes | Text | |
| created_at | DateTime | |

### 3.11 talent_pool — 人才储备池

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Integer PK | |
| name / phone / nationality | String | |
| source_type | String(10) | own/supplier |
| supplier_id | Integer nullable | |
| preferred_biz_line | String(10) | |
| preferred_warehouses | Text | JSON |
| position | String(30) | |
| expected_rate | Float | |
| languages / skills | String | |
| pool_status | String(20) | available/contacted/interviewing/hired/rejected |
| match_score | Float | |
| referrer | String(50) | |
| notes | Text | |
| created_at | DateTime | |

### 3.12 ★ referral_records — 员工推荐奖励记录

> **业务规则来源**：员工推荐奖励计划 V2.0

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Integer | PK | |
| referral_no | String(20) | unique | REF-202601-001 |
| referrer_emp_id | Integer | FK→employees.id, not null | 推荐人员工ID |
| referrer_emp_no | String(20) | not null | 推荐人工号 |
| referrer_name | String(100) | not null | |
| referrer_grade | String(5) | not null | 推荐人职级 (仅P1-P5可获奖) |
| referee_emp_id | Integer | FK→employees.id, nullable | 被推荐人(入职后关联) |
| referee_name | String(100) | not null | 被推荐人姓名 |
| referee_phone | String(30) | | |
| referee_target_grade | String(5) | not null | 被推荐人目标职级 |
| **reward_tier** | **String(10)** | **not null** | **P1_P4 / P5 / P6 / P7 / P8 / P9** |
| status | String(20) | default='submitted' | submitted/verified/onboarded/day14_confirmed/month1/month3/month6/month12/completed/cancelled |
| submitted_at | DateTime | not null | 推荐提交时间 |
| verified_at | DateTime | nullable | HR预审通过时间 |
| onboard_date | Date | nullable | 被推荐人入职日期 |
| day14_confirmed | Boolean | default=False | 14天确认 |
| day14_confirmed_at | Date | nullable | |
| **reward_onboard** | **Float** | **default=0** | 到岗奖金 (14天后发) |
| **reward_month1** | **Float** | **default=0** | +1月留存奖 |
| **reward_month3** | **Float** | **default=0** | +3月留存奖 |
| **reward_month6** | **Float** | **default=0** | +6月留存奖 |
| **reward_month12** | **Float** | **default=0** | +12月留存奖 |
| reward_batch_bonus | Float | default=0 | 批量推荐额外奖 |
| reward_special_bonus | Float | default=0 | 特殊加分项(S1-S3) |
| reward_rank_multiplier | Float | default=1.0 | 等级加成系数 (1.0/1.05/1.10/1.15) |
| reward_total_paid | Float | default=0 | 已发放总额 |
| reward_total_pending | Float | default=0 | 待发放总额 |
| is_scarce_position | Boolean | default=False | S1 稀缺岗位 ×1.5 |
| is_off_season | Boolean | default=False | S2 淡季 +€50 |
| is_cross_region | Boolean | default=False | S3 跨区域 +€80 |
| fraud_flag | Boolean | default=False | 防刷标记 |
| notes | Text | | |
| created_at | DateTime | | |
| updated_at | DateTime | | |

**推荐奖励金额矩阵 (写入 config 或 seed)**：

```python
REFERRAL_REWARDS = {
    "P1_P4": {"onboard": 60, "month1": 40, "month3": 80, "month6": 50, "month12": 70, "max": 300},
    "P5":    {"onboard": 250, "month1": 100, "month3": 150, "month6": 200, "month12": 100, "max": 800},
    "P6":    {"onboard": 300, "month1": 120, "month3": 180, "month6": 250, "month12": 150, "max": 1000},
    "P7":    {"onboard": 400, "month1": 150, "month3": 200, "month6": 300, "month12": 200, "max": 1250},
    "P8":    {"onboard": 500, "month1": 180, "month3": 250, "month6": 350, "month12": 220, "max": 1500},
    "P9":    {"onboard": 600, "month1": 200, "month3": 300, "month6": 400, "month12": 300, "max": 1800},
}
BATCH_BONUS = {3: 100, 5: 250, 10: 500}  # 同月推荐人数 → 额外奖
RANK_THRESHOLDS = {0: 1.0, 4: 1.05, 10: 1.10, 20: 1.15}  # 累计人数 → 加成系数
SPECIAL_MULTIPLIER_SCARCE = 1.5
SPECIAL_BONUS_OFFSEASON = 50
SPECIAL_BONUS_CROSS_REGION = 80
REWARD_CAP_MULTIPLIER = 3.0  # 总奖励上限 = 基础奖 × 3
```

**services/referral_engine.py 核心逻辑**：
1. `check_eligibility(referrer)`: 推荐人必须 P1-P5、试用期满、在职
2. `check_cooldown(referee)`: 被推荐人6个月内无离职重入职记录
3. `check_relationship(referrer, referee)`: 非直系亲属
4. `calculate_reward(record)`: 根据tier + 特殊加分 + 等级加成计算
5. `check_milestone(record, milestone)`: 14天/1月/3月/6月/12月节点检查
6. `detect_anomaly(referrer_id, month)`: 防刷检测 (>50%3月内离职 / 满节点后7天离职 / 单月>5人)
7. `calculate_batch_bonus(referrer_id, month)`: 同月批量推荐额外奖
8. `update_rank(referrer_id)`: 更新推荐人累积等级

### 3.13 ★ commission_records — 合作伙伴返佣记录

> **业务规则来源**：推荐返佣方案 V1.0

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| id | Integer | PK | |
| commission_no | String(20) | unique | COM-202601-001 |
| referrer_name | String(100) | not null | 推荐人(个人或机构) |
| referrer_type | String(20) | not null | individual/institution |
| referrer_contact | String(100) | | |
| referrer_iban | String(40) | | |
| referrer_tax_id | String(30) | | Steueridentifikationsnummer |
| client_name | String(100) | not null | 被引荐的客户名称 |
| client_warehouse | String(10) | | 客户仓库代码 |
| contract_no | String(50) | | 关联劳务合同编号 |
| contract_start | Date | | |
| **tier** | **String(20)** | **not null** | **bronze/silver/gold/platinum** |
| **commission_rate** | **Float** | **not null** | **3.0/4.0/5.0/6.0 (%)** |
| **validity_months** | **Integer** | | **12/12/18/24** |
| validity_start | Date | | 佣金计提开始日 |
| validity_end | Date | | 佣金有效截止日 |
| first_payout_delay | Integer | | 首次结算前等待月数 (3/2/1/0) |
| status | String(20) | default='pending' | pending/active/expired/terminated |
| notes | Text | | |
| created_at | DateTime | | |

### 3.14 ★ commission_monthly — 返佣月度明细

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Integer PK | |
| commission_id | Integer FK→commission_records.id | 关联返佣记录 |
| period | String(7) | 2026-01 |
| client_invoice_amount | Float | 当月客户实付劳务费(税前净额) |
| commission_rate | Float | 当期适用比例 |
| commission_amount | Float | 当月返佣金额 |
| payment_status | String(20) | pending/paid/disputed |
| payment_date | Date nullable | |
| notes | Text | |
| created_at | DateTime | |

**返佣等级矩阵**：
```python
COMMISSION_TIERS = {
    "bronze":   {"min": 0,     "max": 5000,  "rate": 0.03, "months": 12, "delay": 3},
    "silver":   {"min": 5001,  "max": 15000, "rate": 0.04, "months": 12, "delay": 2},
    "gold":     {"min": 15001, "max": 40000, "rate": 0.05, "months": 18, "delay": 1},
    "platinum": {"min": 40001, "max": None,  "rate": 0.06, "months": 24, "delay": 0},
}
```

**services/commission_engine.py 核心逻辑**：
1. `determine_tier(avg_monthly_invoice)`: 连续3个月均值定级
2. `check_upgrade(record)`: 连续3月超上限 → 自动升级; 单月超150% → 即时升级
3. `check_downgrade(record)`: 低于下限 → 1月观察期 → 降级
4. `calculate_monthly(record, invoice_amount)`: 月度返佣 = invoice × rate
5. `generate_payout(period)`: 次月15日前批量生成付款

### 3.15 ★ quotations — 报价单

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Integer PK | |
| quote_no | String(20) unique | QT-202601-001 |
| client_name | String(100) | |
| client_contact | String(100) | |
| warehouse_code | String(10) | |
| biz_line | String(10) | |
| project_type | String(30) | dispatch(纯派遣) / werkvertrag(项目承包) / cross_docking(快转仓) |
| status | String(20) | draft/sent/negotiating/accepted/rejected |
| valid_until | Date | 报价有效期 |
| **cost_hourly_rate** | **Float** | 我方人力小时成本 |
| **cost_social_rate** | **Float** | 社保附加比例 |
| **cost_management_fee** | **Float** | 管理费比例 |
| **cost_total_per_hour** | **Float** | 综合小时成本 |
| **quote_hourly_rate** | **Float** | 报价小时单价 |
| **quote_margin** | **Float** | 目标毛利率 |
| items_json | Text | JSON: 报价明细行项 |
| volume_tier | String(10) | tier1/tier2/tier3/tier4 |
| volume_discount | Float | 阶梯折扣比例 |
| total_monthly_estimate | Float | 月度预估总额 |
| approved_by | String(50) | |
| approved_at | DateTime | |
| notes | Text | |
| created_at / updated_at | DateTime | |

### 3.16 ★ cost_calculations — 成本测算记录

| 字段 | 类型 | 说明 |
|---|---|---|
| id | Integer PK | |
| calc_no | String(20) unique | COST-202601-001 |
| quotation_id | Integer nullable FK→quotations.id | 关联报价单 |
| warehouse_code | String(10) | |
| project_type | String(30) | |
| headcount | Integer | 预估人数 |
| avg_grade | String(5) | 平均职级 |
| **base_hourly** | **Float** | P级基础时薪 (P1=€13.90) |
| **grade_coefficient** | **Float** | 职级系数 |
| **gross_hourly** | **Float** | = base_hourly × grade_coefficient |
| social_insurance_rate | Float | 社保附加% (~21%) |
| vacation_provision | Float | 年假拨备% (~10%) |
| sick_leave_provision | Float | 病假拨备% (~5%) |
| management_overhead | Float | 管理费% (驻仓经理分摊) |
| equipment_cost | Float | 设备工具分摊 |
| **total_cost_per_hour** | **Float** | 综合每小时成本 |
| target_margin | Float | 目标毛利率 |
| **suggested_rate** | **Float** | 建议报价 = total_cost / (1 - margin) |
| monthly_hours_estimate | Float | 预估月工时 |
| monthly_revenue_estimate | Float | |
| monthly_cost_estimate | Float | |
| monthly_profit_estimate | Float | |
| notes | Text | |
| created_at | DateTime | |

**services/cost_calculator.py 核心逻辑**：
```python
# P1-P9 薪资体系
BASE_MONTHLY = 2400.0  # €
COEFFICIENTS = {"P1":1.0,"P2":1.05,"P3":1.10,"P4":1.20,"P5":1.30,"P6":1.40,"P7":1.50,"P8":1.60,"P9":1.80}
P1_HOURLY = 13.90  # €/h (MiLoG 最低工资之上)

def calc_hourly_cost(grade="P1"):
    gross = P1_HOURLY * COEFFICIENTS[grade]
    social = gross * 0.21        # AG-Anteil Sozialversicherung
    vacation = gross * 0.10      # Urlaubsrückstellung
    sick = gross * 0.05          # Krankenstandsrückstellung
    mgmt = gross * 0.08          # 管理费分摊 (驻仓经理等)
    total = gross + social + vacation + sick + mgmt
    return total  # ≈ €20.0/h for P1

def suggest_quote(total_cost, target_margin=0.20):
    return total_cost / (1 - target_margin)
```

**services/quotation_builder.py**：
- 从 v7.0 阶梯价格表加载所有作业项单价
- 根据客户预估业务量自动匹配 Tier (9A-9D)
- 生成报价单 PDF (德语, 含 Netto + MwSt.)
- 4类阶梯折扣独立计算、互不叠加

### 3.17 audit_logs — 审计日志

> 同上一版 schema。

---

## 四、API 路由设计 (全量)

统一前缀: `/api/v1`

### 4.1 认证 /auth
| Method | Path | 说明 | 权限 |
|---|---|---|---|
| POST | /auth/login | 登录获取JWT | public |
| POST | /auth/refresh | 刷新token | authenticated |
| GET | /auth/me | 当前用户信息 | authenticated |
| PUT | /auth/password | 修改密码 | authenticated |

### 4.2 员工 /employees
| Method | Path | 权限 |
|---|---|---|
| GET | /employees | admin/hr/mgr: 全部; wh: 本仓; sup: 自己人 |
| POST | /employees | admin/hr |
| GET | /employees/{id} | 同列表权限 |
| PUT | /employees/{id} | admin/hr |
| DELETE | /employees/{id} | admin (软删除) |
| GET | /employees/export | admin/hr |
| POST | /employees/import | admin/hr (批量CSV) |

### 4.3 供应商 /suppliers, 仓库 /warehouses
> 标准 CRUD，admin/hr 可写，其他只读

### 4.4 工时 /timesheets
| Method | Path | 权限 |
|---|---|---|
| GET | /timesheets | 行级过滤(仓库/供应商/自己) |
| POST | /timesheets | admin/hr/wh |
| POST | /timesheets/batch | admin/hr (批量/OCR导入) |
| PUT | /timesheets/{id} | draft状态可改 |
| PUT | /timesheets/{id}/approve | wh→fin→booked |
| PUT | /timesheets/{id}/reject | wh/fin |
| GET | /timesheets/export | admin/hr/fin |

### 4.5 装卸柜 /containers
| Method | Path | 权限 |
|---|---|---|
| GET | /containers | admin/hr/wh(本仓) |
| POST | /containers | admin/wh |
| POST | /containers/{id}/split | 拆分到工时表 |
| PUT | /containers/{id}/approve | wh→fin |

### 4.6 结算 /settlements
| Method | Path | 权限 |
|---|---|---|
| POST | /settlements/generate | admin/fin (生成月结算) |
| GET | /settlements/employee | admin/fin |
| GET | /settlements/supplier | admin/fin; sup(自己) |
| GET | /settlements/project | admin/fin |
| GET | /settlements/export/{type}/{period} | PDF/Excel导出 |

### 4.7 ★ 推荐奖励 /referrals
| Method | Path | 说明 | 权限 |
|---|---|---|---|
| GET | /referrals | 列表(推荐人可看自己) | admin/hr/自己 |
| POST | /referrals | 提交推荐 | P1-P5在职员工 |
| PUT | /referrals/{id}/verify | HR预审通过 | hr |
| PUT | /referrals/{id}/confirm-onboard | 确认入职 | hr |
| PUT | /referrals/{id}/confirm-day14 | 14天确认 | hr |
| POST | /referrals/check-milestones | 批量检查节点(定时任务) | admin/hr |
| GET | /referrals/my-stats | 我的推荐统计(等级/累计) | authenticated |
| GET | /referrals/anomaly-report | 防刷异常报告 | admin/hr |
| GET | /referrals/payout-summary/{period} | 月度待发放汇总 | admin/fin |

### 4.8 ★ 返佣 /commissions
| Method | Path | 说明 | 权限 |
|---|---|---|---|
| GET | /commissions | 返佣协议列表 | admin/fin |
| POST | /commissions | 创建返佣协议 | admin |
| PUT | /commissions/{id} | 更新(等级调整等) | admin |
| GET | /commissions/{id}/monthly | 月度返佣明细 | admin/fin |
| POST | /commissions/calculate/{period} | 计算月度返佣 | admin/fin |
| PUT | /commissions/monthly/{id}/pay | 标记已付款 | fin |
| GET | /commissions/export/{period} | 导出返佣报表 | admin/fin |

### 4.9 ★ 报价与成本 /quotations
| Method | Path | 说明 | 权限 |
|---|---|---|---|
| GET | /quotations | 报价单列表 | admin/fin/mgr |
| POST | /quotations | 创建报价单 | admin/mgr |
| PUT | /quotations/{id} | 更新报价 | admin/mgr |
| POST | /quotations/{id}/calculate-cost | 执行成本测算 | admin/fin |
| PUT | /quotations/{id}/approve | 审批报价单 | admin(>€50k需P9) |
| GET | /quotations/{id}/export-pdf | 导出报价单PDF(德语) | admin/fin |
| GET | /quotations/price-matrix | 获取当前价格矩阵(v7.0) | admin/fin/mgr |
| PUT | /quotations/price-matrix | 更新价格矩阵 | admin |
| GET | /cost-calculations | 成本测算记录 | admin/fin |
| POST | /cost-calculations | 独立成本测算(不关联报价) | admin/fin |

### 4.10 派遣 /dispatch, 人才 /talent
> 标准 CRUD + 匹配/漏斗统计

### 4.11 仪表盘 /dashboard
| Method | Path | 说明 |
|---|---|---|
| GET | /dashboard/stats | 总览统计(员工数/工时/待审批/本月结算) |
| GET | /dashboard/charts | 图表数据(月度趋势/仓库分布/供应商贡献) |
| GET | /dashboard/referral-summary | ★ 推荐奖励汇总 |
| GET | /dashboard/commission-summary | ★ 返佣汇总 |
| GET | /dashboard/margin-analysis | ★ 毛利分析(按仓库/项目) |

### 4.12 管理 /admin
| Method | Path | 权限 |
|---|---|---|
| GET/POST/PUT | /admin/users | admin |
| GET | /admin/audit-logs | admin |
| GET/PUT | /admin/warehouses | admin |
| GET/PUT | /admin/system-config | admin (业务常量配置) |

---

## 五、权限矩阵（后端中间件强制执行）

### 5.1 三层校验流程

```
请求 → ① JWT 认证 (解析token, 获取user_id+role)
     → ② 角色校验 (role是否有权访问该endpoint)
     → ③ 行级过滤 (自动注入WHERE条件):
         - role=sup → WHERE supplier_id = user.bound_supplier_id
         - role=wh  → WHERE warehouse_code = user.bound_warehouse
         - role=worker → WHERE employee_id = user对应的employee.id
```

### 5.2 敏感字段过滤

以下字段**仅**返回给 admin/hr/fin 角色，其他角色返回 null：
- employees: tax_id, social_security_no, iban, hourly_rate
- timesheets: amount_total, amount_deduction
- settlements: 所有金额字段 (对 sup 角色仅显示自己的)

---

## 六、前端页面清单 (18 页)

| # | 路由 | 页面 | 可见角色 |
|---|---|---|---|
| 1 | /login | 登录页 | public |
| 2 | / | Dashboard 仪表盘 | all |
| 3 | /employees | 员工花名册 | admin/hr/mgr/wh(本仓)/sup(自己人) |
| 4 | /suppliers | 供应商管理 | admin/hr |
| 5 | /talent | 人才储备池 | admin/hr |
| 6 | /dispatch | 派遣需求 | admin/hr |
| 7 | /recruit | 招聘漏斗 | admin/hr |
| 8 | /timesheets | 工时管理 | all(行级过滤) |
| 9 | /clock | 打卡 | wh/worker |
| 10 | /containers | 装卸柜记录 | admin/hr/wh |
| 11 | /settlements | 结算管理 | admin/fin/sup(自己) |
| 12 | /referrals | ★ 推荐奖励 | admin/hr/P1-P5(自己) |
| 13 | /commissions | ★ 返佣管理 | admin/fin |
| 14 | /quotations | ★ 报价与成本 | admin/fin/mgr |
| 15 | /warehouses | 仓库配置 | admin |
| 16 | /messages | 消息联动 | all |
| 17 | /audit-logs | 审计日志 | admin |
| 18 | /admin | 系统管理 | admin |

---

## 七、实施顺序（Agent 必须按此顺序构建）

### Phase 1: 基础平台 (优先级最高)
1. backend/config.py + database.py + main.py
2. models/user.py + middleware/auth.py + routers/auth.py
3. models/employee.py + supplier.py + warehouse.py + schemas + routers
4. seed/init_data.py (7用户 + 5供应商 + 10仓库)
5. frontend: Vite + Tailwind + Router + Layout + Login + i18n
6. deploy: Dockerfile + railway.toml → 验证部署

### Phase 2: 核心业务
7. models/timesheet.py + container.py + schemas + routers
8. services/settlement_calc.py (4种结算)
9. routers/timesheets.py (CRUD + 审批流)
10. routers/containers.py (CRUD + 拆分)
11. frontend: Timesheet + Container + Clock 页面

### Phase 3: 结算财务
12. models/settlement.py + routers/settlements.py
13. routers/dashboard.py
14. services/export_service.py (PDF/Excel)
15. frontend: Settlement + Dashboard 页面

### Phase 4: 推荐与返佣 ★
16. models/referral.py + services/referral_engine.py + routers/referrals.py
17. models/commission.py + services/commission_engine.py + routers/commissions.py
18. frontend: Referral + Commission 页面

### Phase 5: 报价与成本 ★
19. models/quotation.py + services/cost_calculator.py + services/quotation_builder.py
20. routers/quotations.py (含价格矩阵管理)
21. frontend: Quotation + Cost 页面
22. 阶梯价格表 v7.0 完整数据 seed

### Phase 6: 进阶功能
23. models/dispatch.py + talent.py + routers
24. services/compliance.py (ArbZG/Zeitkonto)
25. frontend: Dispatch + Talent + Recruit + Messages 页面
26. PWA 离线支持 + 移动端优化

---

## 八、关键业务规则速查（Agent 实现时必须遵循）

### 8.1 结算方式
- **hourly**: amount = base_rate × hours
- **piece**: amount = piece_rate × pieces
- **hourly_kpi**: amount = base_rate × hours × (1 + kpi_ratio)
- **container**: amount = container_rate / group_size (均分) 或按系数分配

### 8.2 班次补贴
- 夜班 (22:00-06:00): +25%
- 周末: +50%
- 节假日: +100%

### 8.3 推荐奖励
- 推荐人资格: 仅 P1-P5 在职员工，试用期满
- P6-P9 管理层不参与推荐奖金（纳入KPI考核）
- 被推荐人 P1-P4 统一档 (max €300), P5-P9 分档递增
- 14天确认后发到岗奖，后续按1/3/6/12月节点分批发
- 防刷: 6个月冷却期、直系亲属排除、异常模式监控

### 8.4 返佣
- 基数 = 客户月付劳务费(税前净额)，不含物料/仓租
- 4级: Bronze 3% / Silver 4% / Gold 5% / Platinum 6%
- 连续3个月均值定级，每半年复评
- 首次结算有延迟期 (Bronze 3月, Platinum 次月)

### 8.5 成本核算
- P1 基础时薪 €13.90，其他P级 = 13.90 × 系数
- 综合成本 ≈ 时薪 × 1.44 (含社保21% + 年假10% + 病假5% + 管理8%)
- 报价 = 综合成本 / (1 - 目标毛利率)

### 8.6 阶梯折扣 (报价)
- 4类独立: 出库量(9A) / 入库量(9B) / WLE量(9C) / 卸柜量(9D)
- 4档: 标准0% / 青铜-3% / 白银-5% / 黄金-8%
- 互不叠加，月度独立评定
- 退货/增值服务/附加费不参与折扣

### 8.7 Werkvertrag vs AÜG
- 渊博 GmbH: Werkvertrag (BGB §631)，交付成果导向
- 579 GmbH: AÜG 纯派遣，仅工时核对
- 579 简化流程: 工时→仓库确认→归档，无复杂成本拆分

### 8.8 DSGVO
- 敏感字段后端按角色过滤，前端永不显示非授权数据
- 审计日志记录所有数据变更
- 不集成微信/WPS等中国平台

---

*文档版本: V7.0 | 最后更新: 2026-03-24 | 适用系统: 渊博579 HR Dispatch Management System*
