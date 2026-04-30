# Power Planner — Solution Overview

**Document Type:** Customer-Facing Solution Overview  
**Audience:** Decision-Makers, Program Managers, IT Leadership

---

## Executive Summary

Power Planner is a modern task and project management application built natively on Microsoft Power Platform. With **Microsoft Project Online retiring on September 30, 2026**, organizations that rely on it for day-to-day task tracking and team planning need a replacement that is familiar, flexible, and already within their Microsoft ecosystem.

Power Planner delivers a Planner-style Kanban experience — boards, buckets, tasks, checklists, comments, and assignments — hosted entirely within your organization's existing Power Platform environment. There is no new software to license, no new vendor to onboard, and no workforce retraining required. If your teams already use Power Platform, Power Planner can be deployed and in use within days.

---

## Transitioning from Project Online

### Microsoft Project Online Retirement Timeline

Microsoft has announced the official retirement of **Project Online on September 30, 2026**. Key dates:

| Date | Event |
|---|---|
| October 1, 2025 | End of sale for new Project Online-only SKUs |
| April 1, 2026 | Existing customers can no longer create new Project Online tenants |
| **September 30, 2026** | **Project Online retires — all access and data unavailable** |

After the retirement date, organizations will lose access to all Project Online projects and associated data. Microsoft recommends transitioning before that date.

### Microsoft's Recommended Transition Paths

Microsoft offers three primary alternatives, each designed for a specific set of organizational needs:

| Option | Best For | When to Choose |
|---|---|---|
| **Planner (Premium)** | Teams needing Gantt charts, task dependencies, and portfolio views | Organizations that need advanced scheduling and reporting across multiple projects |
| **Project Server Subscription Edition** | Organizations requiring advanced portfolio and program management with on-premises control | IT-mature organizations with existing infrastructure and deep PPM requirements |
| **Dynamics 365 Project Operations** | Professional services firms with timesheet, resource scheduling, and billing needs | Organizations running end-to-end project financials alongside delivery management |

### Where Power Planner Fits

For many organizations — especially those whose teams used Project Online primarily for **task tracking, board-style work management, and light project coordination** — Power Planner offers a focused, lightweight alternative that lives inside their existing Power Platform environment. It requires no new vendor relationships, no new infrastructure, and no licensing beyond existing Power Apps entitlements.

---

## Solution Overview

Power Planner is a **Power Platform Code App** — a React/TypeScript single-page application deployed through and hosted by Power Platform, backed by **Microsoft Dataverse** as its data store. It requires no external infrastructure, no Azure resources beyond what Power Platform already uses, and no additional software licensing beyond your existing Power Apps entitlement.

### How It Works

```
User Browser → Power Platform (Code App Host) → Dataverse (Data Store)
                        ↑
              Microsoft Entra ID (Authentication)
```

Users access Power Planner through the standard Power Apps interface — the same experience they use for other organizational applications. Authentication is handled entirely by Microsoft Entra ID. All data is stored in Dataverse tables within your Power Platform environment.

### What Power Planner Is — and Is Not

Power Planner is purpose-built for **team-level task and work management**. It replaces the board-and-bucket planning experience that teams used in Project Online and Planner, without replicating Project Online's advanced project management features.

| Capability | Power Planner | Notes |
|---|---|---|
| Kanban board with drag-and-drop | ✅ | Core feature |
| Task assignments, checklists, comments | ✅ | Core feature |
| Multiple plans and buckets | ✅ | Core feature |
| Status and priority tracking | ✅ | Core feature |
| Dataverse extensibility | ✅ | Add columns, flows, reports |
| Gantt / timeline view | ❌ | Roadmap item |
| Resource management | ❌ | Out of scope |
| Project dependencies | ❌ | Roadmap item |
| Portfolio / program management | ❌ | Out of scope |

If your Project Online usage was primarily Gantt-driven scheduling with resource allocation, Planner Premium or Project Server Subscription Edition may be the better fit. If your teams primarily used boards, task lists, and assignments, Power Planner is a direct replacement at a fraction of the cost and complexity.

---

## Key Features

| Feature | Description |
|---|---|
| **Board View** | Kanban-style drag-and-drop board organized by bucket (To Do / In Progress / Done or custom) |
| **List View** | Tabular task list with sortable columns for status, priority, due date, and assignee |
| **Plans** | Organize work into discrete plans (equivalent to Planner "plans" or project spaces) |
| **Buckets** | Group tasks within a plan by phase, category, or workflow stage |
| **Tasks** | Full task lifecycle: title, description, status, priority, due date, assignee(s) |
| **Checklists** | Per-task sub-item checklists with completion tracking |
| **Comments** | Threaded comments on individual tasks for team collaboration |
| **Assignments** | Assign tasks to one or more team members with user presence indicators |
| **Priority Levels** | Low / Medium / High / Urgent priority classification |
| **Status Tracking** | Not Started / In Progress / Completed status lifecycle |

---

## Business Benefits

### Productivity
Power Planner provides a familiar, low-friction interface modeled on Microsoft Planner. Teams already comfortable with Planner-style task management can adopt Power Planner with minimal training. The drag-and-drop board view reduces the cognitive load of task management, and inline editing minimizes context switching.

### Flexibility
Because Power Planner is built on Dataverse, the underlying data model can be extended without modifying application code. Administrators can add custom columns, create views, and build Power Automate flows against the same tables — adapting the solution to agency-specific workflows without rebuilding the application.

### Extensibility
Power Planner is not a closed system. Every table is available as a standard Dataverse datasource, meaning:
- **Power BI** dashboards can report directly against task and plan data
- **Power Automate** flows can trigger on task creation, status changes, or approaching due dates
- **Other Power Apps** (canvas or model-driven) can reference or display the same data
- **Custom API integrations** can read and write via the Dataverse Web API

### Data Ownership
Unlike SaaS task management tools, Power Planner stores all data in Dataverse tables owned by your organization. There is no vendor data pipeline, no telemetry export, no dependency on a third-party service remaining operational. Your organization owns the schema, the data, and the deployment lifecycle.

---

## Security Overview

Power Planner inherits the full security model of Microsoft Power Platform and Dataverse:

- **Authentication** is handled exclusively by Microsoft Entra ID. No separate credentials or identity provider integration is required.
- **Authorization** is enforced by Dataverse security roles. Users see and interact only with data their role permits.
- **Data in transit** is encrypted via TLS 1.2+ across all communication paths.
- **Data at rest** is encrypted using Microsoft-managed keys within the Dataverse storage layer.
- **Session management** follows Power Platform's standard token lifecycle, with no long-lived credentials stored in the application.

No data leaves the Power Platform environment boundary during normal application operation.

---

## Compliance Considerations

Power Planner's compliance posture is inherited entirely from Power Platform and Dataverse. The application introduces no new endpoints, third-party scripts, or external CDN dependencies, so its compliance footprint is limited to what the Power Platform service itself carries.

| Cloud Tier | Environment | Key Certifications | IL Suitability |
|---|---|---|---|
| **Commercial** | `*.crm.dynamics.com` | ISO 27001, SOC 1/2, FedRAMP Moderate | IL2 |
| **GCC** | `*.crm9.dynamics.com` | FedRAMP Moderate, CJIS | IL2 |
| **GCC High** | `*.crm.microsoftdynamics.us` | FedRAMP High, ITAR, DFARS | IL4, IL5 (some scenarios) |
| **DoD** | `*.crm.appsplatform.us` | FedRAMP High, DoD SRG | IL4, IL5 |

Because the compliance boundary is determined by the Power Platform environment rather than the application, Power Planner can be deployed in any cloud tier your organization is already using — commercial, GCC, GCC High, or DoD — without modification to the application code.

> **Note on Code Apps availability:** As of April 2026, Power Apps Code Apps (the hosting mechanism for Power Planner) is available in commercial and DoD environments. Availability in GCC High is pending Microsoft rollout. Organizations on GCC High should verify feature availability before planning deployment. DoD organizations have confirmed access via the Power Platform DoD environment.

---

## Integration with the Microsoft Ecosystem

| Integration | Capability |
|---|---|
| **Microsoft Dataverse** | Native data store; tables accessible by all Power Platform tools |
| **Power Automate** | Trigger flows on task events (create, update, complete, overdue) |
| **Power BI** | Connect directly to Dataverse tables for task/plan reporting dashboards |
| **Microsoft Teams** | Embed Power Planner as a Teams tab via Power Apps in Teams |
| **Microsoft Entra ID** | User identity, group membership, conditional access |
| **Dataverse Security Roles** | Fine-grained row and column-level access control |

---

## Example Use Cases

### Project Online Migration
An organization currently using Project Online for lightweight team task tracking migrates their active projects into Power Planner before the September 2026 retirement deadline. Each Project Online project becomes a Power Planner Plan. Tasks are recreated with status, priority, and assignees. Teams continue working in a familiar board interface with zero net-new licensing cost.

### Program Management Office (PMO)
A program office manages multiple concurrent initiatives. Each initiative becomes a Power Planner **Plan**. Project leads use the board view to manage sprint-style work items. Leadership uses a connected Power BI dashboard to view cross-plan status in real time.

### Software Development Team
A development team replaces a third-party Kanban tool with Power Planner, keeping their work data inside the Microsoft 365 boundary. Buckets represent sprint stages (Backlog, In Progress, In Review, Done). A Power Automate flow posts to a Teams channel when a task moves to Done.

### IT Help Desk Triage
An IT team uses Power Planner buckets to represent ticket categories (Network, Hardware, Software, Access). Technicians drag tasks across buckets as work progresses. A Power Automate flow notifies assignees when tasks are moved to "In Progress."

### Compliance Tracking
A compliance team tracks regulatory requirements as tasks with due dates and priority levels. Checklist items represent individual sub-requirements. Comments capture evidence and review notes directly on the task record.

### Training Coordination
A training office manages course preparation tasks across multiple programs. Plans represent courses; buckets represent preparation phases (Design, Development, Delivery, Evaluation). Assignments link tasks to responsible instructors.

---

## Future Extensibility

Power Planner is built on open standards (React, TypeScript, Dataverse OData) and designed for incremental enhancement. Planned capability areas include:

- **Notification integration** via Power Automate (email, Teams message)
- **Reporting views** embedded directly in the application
- **Bulk task import** from Excel or SharePoint Lists
- **Calendar / timeline view** for date-based task visualization
- **Teams integration** for @mention-based task assignment
- **Mobile-optimized layout** for field staff

Because the application source code is fully owned by your organization, enhancements can be made by any development team familiar with React and the Power Platform SDK — without waiting on a vendor's product roadmap.

---

*Power Planner is developed and maintained by Microsoft Industry Solutions Delivery.*  
*For questions regarding deployment or licensing, contact your Microsoft account team.*
