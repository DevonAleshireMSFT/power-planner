# Power Planner

**A lightweight, Planner-style task management application built natively on Microsoft Power Platform.**

Power Planner delivers a familiar Kanban board experience — plans, buckets, tasks, checklists, assignments, and comments — hosted entirely within your organization's existing Power Platform environment. No new vendors. No new infrastructure. Licensing requirements are covered in detail below.

---

## Why Power Planner?

### Microsoft Project Online Is Retiring — September 30, 2026

Microsoft has announced the end of Project Online. After the retirement date, all access and data will be unavailable. Organizations that used Project Online for day-to-day task tracking and team planning need a replacement that is:

- **Familiar** — a board-and-bucket interface teams already know
- **Inside your Microsoft environment** — no new vendor relationships or data pipelines
- **Cost-effective** — licensing is limited to standard Power Apps and Dataverse entitlements your organization may already hold
- **Deployable quickly** — live in your environment within days, not months

Power Planner is purpose-built to complement the Microsoft Power Platform ecosystem, providing a lightweight task and work management experience for teams whose primary needs are boards, task lists, and assignments.

---

## Licensing & Prerequisites

Power Planner is built on Microsoft Power Platform and Dataverse. The following requirements apply before deployment.

### Required Licenses

| Requirement | Details |
|---|---|
| **Power Apps per-user plan** or **Power Apps per-app plan** | Required for every end user who accesses Power Planner. Microsoft 365 licenses alone do **not** cover access to custom Dataverse tables. |
| **Dataverse database storage** | Each Power Platform environment requires Dataverse capacity. Tenants receive a base allocation (1 GB) plus an additional 20 MB per Power Apps per-user licensed user. Large deployments may require additional storage add-ons. |

> Microsoft 365 E3/E5 and Office 365 licenses include limited "seeded" Power Apps use, but this does **not** extend to custom Dataverse tables. Users accessing Power Planner must hold a standalone Power Apps per-user plan or be covered by a per-app plan. Contact your Microsoft account team for current pricing.

### Platform Prerequisites

| Prerequisite | Notes |
|---|---|
| **Power Apps Code Apps** | Must be available and enabled in your Power Platform environment. As of April 2026, Code Apps are available in **Commercial and DoD** environments only. GCC High availability is pending Microsoft rollout — verify before planning deployment. |
| **Dataverse environment** | A Power Platform environment with a Dataverse database must exist. Code Apps cannot be deployed to environments without Dataverse. |
| **Environment Maker or System Administrator role** | The person deploying Power Planner needs sufficient permissions to create Dataverse tables and publish the Code App. |
| **Microsoft Entra ID** | Required for user authentication. No additional identity provider configuration is needed if your organization already uses Entra ID (formerly Azure AD). |

### Optional Integrations (Separate Licensing May Apply)

| Integration | License Required |
|---|---|
| Power Automate flows | Power Automate per-user or per-flow plan (or seeded entitlement via Power Apps license) |
| Power BI dashboards | Power BI Pro or Premium Per User for published reports shared with others |
| Microsoft Teams tab embedding | No additional license — included with Teams access |

---

## What Power Planner Does

| Feature | Description |
|---|---|
| **Board View** | Kanban drag-and-drop board organized by bucket (e.g. To Do / In Progress / Done or custom stages) |
| **List View** | Tabular task list with sortable columns for status, priority, due date, and assignee |
| **Plans** | Organize work into discrete plans — equivalent to Planner "plans" or project spaces |
| **Buckets** | Group tasks within a plan by phase, category, or workflow stage |
| **Tasks** | Full task lifecycle: title, description, status, priority, due date, and assignee(s) |
| **Checklists** | Per-task sub-item checklists with completion tracking |
| **Comments** | Threaded comments on individual tasks for team collaboration |
| **Assignments** | Assign tasks to team members with user presence indicators |
| **Priority Levels** | Low / Medium / High / Urgent classification |
| **Status Tracking** | Not Started / In Progress / Completed lifecycle |

---

## Interface

### Board View
![Power Planner Board View](/docs/screenshots/board-view.png)

### List View
![Power Planner List View](docs\screenshots\list-view.png)

---

## Where You Can Use It

Power Planner runs as a **Power Platform Code App**, which means it can be deployed anywhere your organization runs Power Platform:

| Cloud Tier | Environment | Compliance Coverage |
|---|---|---|
| Commercial | `*.crm.dynamics.com` | ISO 27001, SOC 1/2, FedRAMP Moderate |
| GCC | `*.crm9.dynamics.com` | FedRAMP Moderate, CJIS |
| GCC High | `*.crm.microsoftdynamics.us` | FedRAMP High, ITAR, DFARS |
| DoD | `*.crm.appsplatform.us` | FedRAMP High, DoD SRG |

> **Note:** As of April 2026, Power Apps Code Apps are available in Commercial and DoD environments. GCC High availability is pending Microsoft rollout — verify before planning deployment.

Users access Power Planner through the standard Power Apps interface. Authentication is handled entirely by Microsoft Entra ID. All data is stored in Dataverse within your existing environment boundary.

---

## Example Use Cases

**Project Online Migration** — Migrate active projects before the September 2026 deadline. Each Project Online project becomes a Power Planner Plan with tasks, statuses, and assignees intact.

**Program Management Office (PMO)** — Each initiative becomes a Plan. Leadership connects a Power BI dashboard directly to Dataverse for real-time cross-plan visibility.

**Software Development Teams** — Replace a third-party Kanban tool while keeping work data inside the Microsoft 365 boundary. Buckets represent sprint stages; a Power Automate flow posts to Teams on task completion.

**IT Help Desk Triage** — Buckets represent ticket categories. Technicians drag tasks as work progresses; flows notify assignees on status changes.

**Compliance Tracking** — Tasks represent regulatory requirements with due dates and priorities. Checklist items map to sub-requirements; comments capture evidence and review notes.

---

## Integration with the Microsoft Ecosystem

Because Power Planner is built on Dataverse, it connects natively with the rest of the Power Platform:

- **Power Automate** — trigger flows on task creation, status changes, or approaching due dates
- **Power BI** — report directly against task and plan data without an ETL pipeline
- **Microsoft Teams** — embed Power Planner as a tab via Power Apps in Teams
- **Other Power Apps** — canvas or model-driven apps can reference the same Dataverse tables
- **Dataverse Web API** — read and write via standard OData endpoints for custom integrations

---

## Security

Power Planner inherits the full security model of Microsoft Power Platform and Dataverse:

- Authentication via **Microsoft Entra ID** — no separate credentials required
- Authorization enforced by **Dataverse security roles** — row and column-level access control
- **TLS 1.2+** for all data in transit
- **Microsoft-managed encryption** for all data at rest
- No data leaves the Power Platform environment boundary during normal operation

---

## Documentation

- [Solution Overview](docs/power-planner-solution-overview.md) — executive summary, business benefits, and compliance details
- [Dataverse Setup](docs/dataverse-setup.md) — table schema and environment configuration
- [Security Model](docs/power-planner-security-model.md) — role definitions and access control

---

*Power Planner is developed and maintained by Microsoft Industry Solutions Delivery.*
