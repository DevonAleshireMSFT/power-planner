# Dataverse Schema — Power Planner

## Publisher prefix
All custom tables use prefix `pp_` (adjust to match your org's publisher prefix).

---

## Tables

### 1. `pp_plan` — Plans/Projects

| Column | Type | Notes |
|---|---|---|
| `pp_planid` | Primary Key (GUID) | Auto |
| `pp_name` | Text (200) | Required |
| `pp_description` | Multiline Text (2000) | |
| `pp_startdate` | Date Only | |
| `pp_enddate` | Date Only | |
| `ownerid` | Owner (lookup → systemuser / team) | Standard column |
| `statecode` | Status (standard) | 0=Active, 1=Inactive |
| `statuscode` | Status Reason (standard) | |

---

### 2. `pp_bucket` — Buckets

| Column | Type | Notes |
|---|---|---|
| `pp_bucketid` | Primary Key (GUID) | Auto |
| `pp_name` | Text (200) | Required |
| `pp_order` | Whole Number | Sort order |
| `pp_planid` | Lookup → `pp_plan` | Required |

---

### 3. `pp_task` — Tasks

| Column | Type | Notes |
|---|---|---|
| `pp_taskid` | Primary Key (GUID) | Auto |
| `pp_title` | Text (300) | Required |
| `pp_description` | Multiline Text (4000) | |
| `pp_startdate` | Date Only | |
| `pp_duedate` | Date Only | |
| `pp_status` | Choice | 0=Not Started, 1=In Progress, 2=Completed |
| `pp_priority` | Choice | 0=Low, 1=Medium, 2=High, 3=Urgent |
| `pp_planid` | Lookup → `pp_plan` | Required |
| `pp_bucketid` | Lookup → `pp_bucket` | Optional |
| `statecode` | Status (standard) | 0=Active |

---

### 4. `pp_taskassignment` — Task Assignments

| Column | Type | Notes |
|---|---|---|
| `pp_taskassignmentid` | Primary Key (GUID) | Auto |
| `pp_taskid` | Lookup → `pp_task` | Required |
| `pp_assigneeid` | Lookup → `systemuser` | Required |

**Relationship:** Many-to-one from `pp_taskassignment` → `pp_task`  
**Relationship:** Many-to-one from `pp_taskassignment` → `systemuser`

---

### 5. `pp_comment` — Comments

| Column | Type | Notes |
|---|---|---|
| `pp_commentid` | Primary Key (GUID) | Auto |
| `pp_content` | Multiline Text (4000) | Required |
| `pp_taskid` | Lookup → `pp_task` | Required |
| `pp_authorid` | Lookup → `systemuser` | Required |
| `createdon` | Date/Time (standard) | Auto-populated |

---

### 6. `pp_checklistitem` — Checklist Items

| Column | Type | Notes |
|---|---|---|
| `pp_checklistitemid` | Primary Key (GUID) | Auto |
| `pp_title` | Text (200) | Required |
| `pp_iscomplete` | Yes/No (Boolean) | Default: No |
| `pp_order` | Whole Number | Sort order |
| `pp_taskid` | Lookup → `pp_task` | Required |

---

## Security & GCCH Notes

- **Roles:** Create a custom security role with CRUD on the six tables above.
  Assign to all users who need access.
- **Ownership:** `pp_plan` uses the standard `ownerid` column. Task creation
  by default inherits the plan owner — adjust business rules as needed.
- **GCCH endpoints:** When deployed to GCCH, the Dataverse Web API resolves
  to `https://<org>.crm.microsoftdynamics.us`. No code changes required —
  the Power Apps Code Apps runtime handles environment routing.
- **Authentication:** Entra ID (formerly Azure AD) — GCCH tenants use the
  `.us` Entra ID endpoint. The `getContext()` call in `App.tsx` retrieves
  the signed-in user's `objectId` and UPN automatically.

---

## DataSourcesInfo Configuration

In production, the Power Apps runtime injects the `DataSourcesInfo` object
into your Code App via app settings. During local development, use the
`createMockDataExecutor` from `@microsoft/power-apps/data/executors`:

```typescript
import { setDataOperationExecutor, createMockDataExecutor } from '@microsoft/power-apps/data/executors';

setDataOperationExecutor(
  createMockDataExecutor({
    pp_plans: [
      { pp_planid: 'plan-1', pp_name: 'Demo Plan', statecode: 0, statuscode: 1, pp_status: 0 },
    ],
    pp_tasks: [],
    pp_buckets: [],
    pp_comments: [],
    pp_checklistitems: [],
    pp_taskassignments: [],
  })
);
```

Call `setDataOperationExecutor(...)` **before** `ReactDOM.createRoot(...)` in `main.tsx`.
