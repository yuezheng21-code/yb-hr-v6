# 对外接口：YBKPI（ybkpi.com）/ 卸柜记录软件 / 其他系统

> 给对接方开发者（子豪等）的说明。所有接口均为 HTTPS + JSON，基础地址：`https://<本系统域名>`

## 1. 获取密钥
管理员在 **作业记录 → 系统对接/账号映射 → 外部系统接入 → 新建接入源**：
- 系统选「YBKPI（ybkpi.com）」或「卸柜记录软件」；
- 勾选权限范围（每个对接方单独一把密钥，按最小权限勾选）：

| 权限 | 说明 |
|---|---|
| `ops:write` | 推送作业记录 |
| `containers:write` | 推送装卸柜记录 |
| `employees:read` | 读取人员信息 |

- 密钥（`ybk_…`）只显示一次；系统只存哈希。可随时「↻ 密钥」轮换或停用。
- 请求头：`X-API-Key: ybk_…`。无效 → 401，权限不足 → 403。

## 2. 连通测试
`GET /api/v1/ext/ping` → `{"source":"子豪 YBKPI","system":"ybkpi","scopes":{...},"server_time":"…Z"}`

## 3. 推送作业记录（YBKPI → 本系统）`ops:write`
`POST /api/v1/ext/operations`（与 `/api/v1/ops/ingest` 相同）

```json
{"records":[{"task_id":"Y-1001","operator":"zhang01","op_type":"拣货","qty":120,
  "date":"2026-10-08","start_time":"08:00","end_time":"09:00","warehouse":"UNA","client":"Amazon"}]}
```
- 字段名支持中/英/德常见写法（task_id/作业单号、operator/操作人、qty/数量…），也可在接入源上配置字段映射 JSON，如 `{"operator":"staffAccount","qty":"pcs"}`。
- `task_id` 幂等：重复推送自动跳过。`?dry_run=true` 只校验不入库。单次 ≤ 上限条数。
- `operator` 为 YBKPI 内的账号：在「账号映射」中绑定到本系统员工（或直接传本系统工号 `emp_no`）。未匹配的记录进入「未匹配」，补映射后自动重新匹配。

## 4. 推送装卸柜记录（卸柜记录软件 → 本系统）`containers:write`
`POST /api/v1/ext/containers`

```json
{"records":[{"external_id":"C-20261008-01","container_no":"MSKU1234567","work_date":"2026-10-08",
  "warehouse_code":"UNA","container_type":"40HC","load_type":"unload",
  "start_time":"08:00","end_time":"10:30","workers":["YB-2026-001","zhang01"],
  "seal_no":"S123","video_recorded":true,"notes":""}]}
```
| 字段 | 必填 | 说明 |
|---|---|---|
| external_id | ✓ | 对方系统的记录 ID，幂等键 |
| container_no | ✓ | 柜号 |
| work_date | ✓ | `YYYY-MM-DD` 或 `DD.MM.YYYY` |
| warehouse_code |  | 缺省用接入源默认仓库 |
| container_type |  | 20GP / 40GP / 40HC(40HQ) / 45HC / LKW，默认 20GP |
| load_type |  | unload（卸）/ load（装），默认 unload |
| start_time / end_time |  | `HH:MM` 或 ISO 时间 |
| workers |  | 工号或该系统操作员账号的数组 |

- 同一 `external_id` 再次推送：**未审批**的记录会被更新；已审批的不会被覆盖（返回 `skipped_approved`）。
- 接入源勾选「推送后自动确认」→ 直接记为仓库已审批；否则在「卸柜记录」中待仓管审批。
- 已审批的柜子可在「系统对接 → 卸柜记录 → 作业记录」同步为每人 1/n 柜的作业记录，进入绩效与结算。
- 返回 `created / updated / skipped_approved / errors[] / warnings[]`（warnings 列出未匹配的工人）。

## 5. 读取人员信息（本系统 → YBKPI）`employees:read`
`GET /api/v1/ext/employees?status=active|inactive|all&warehouse=UNA&updated_since=2026-10-01T00:00:00&format=json|csv`

返回字段（数据最小化）：`emp_no, name, status, warehouse_code, position, grade, biz_line, source_type, supplier, join_date, leave_date, operator_accounts, updated_at`
- `operator_accounts`：该员工在对方系统（接入源所属系统）中绑定的操作员账号。
- `updated_since`：增量同步，建议对方每次保存上次的 `generated_at` 作为下次参数。
- 不返回电话、证件、税号、社保号、IBAN、工资。
- `format=csv` 为 UTF-8（带 BOM）CSV，Excel 可直接打开。

## 6. 本系统主动拉取 YBKPI
需要 YBKPI 提供 API 文档与密钥后可增加定时拉取。目前推荐由 YBKPI 推送（第 3 节），或在「文件导入」中选择系统「YBKPI」上传其导出的 Excel/CSV。
