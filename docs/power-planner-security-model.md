# Power Planner — Technical Security & Permissions Model

**Document Type:** Technical Reference — Security Architecture  
**Audience:** Administrators, Solution Architects, Security Reviewers

---

## Architecture Context

### Power Platform Components

Power Planner is composed of the following Power Platform components:

| Component | Role |
|---|---|
| **Power Apps Code App** | React/TypeScript single-page application hosted by Power Platform; serves the user interface |
| **Microsoft Dataverse** | Relational data store; hosts all six custom tables and enforces row/column-level security |
| **Microsoft Entra ID** | Identity provider; handles authentication and token issuance |
| **Power Platform Environment** | Deployment boundary; isolates data, security roles, and connections |

No external compute, storage, or networking resources are required. The application runs entirely within the Power Platform service boundary.

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Power Platform Environment                                  │
│                                                             │
│  ┌─────────────────┐      ┌──────────────────────────────┐  │
│  │  Code App Host  │◄────►│  Dataverse                   │  │
│  │  (Power Planner)│      │  - pplanner_plan             │  │
│  └────────┬────────┘      │  - pplanner_bucket           │  │
│           │               │  - pplanner_task             │  │
│           │ Entra ID      │  - pplanner_taskassignment   │  │
│           │ Token         │  - pplanner_comment          │  │
│           ▼               │  - pplanner_checklistitem    │  │
│  ┌─────────────────┐      └──────────────────────────────┘  │
│  │  Microsoft      │                                         │
│  │  Entra ID       │                                         │
│  └─────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

### Cloud Deployment Options

Power Planner runs on any Power Platform cloud tier without modification. The Dataverse tables and application code are identical across deployments; only the service endpoints differ.

| Cloud | Dataverse Endpoint | Auth Endpoint | IL Suitability | Code Apps Available |
|---|---|---|---|---|
| Commercial | `*.crm.dynamics.com` | `login.microsoftonline.com` | IL2 | ✅ |
| GCC | `*.crm9.dynamics.com` | `login.microsoftonline.com` | IL2 | ✅ |
| GCC High | `*.crm.microsoftdynamics.us` | `login.microsoftonline.us` | IL4, IL5 | ⏳ Pending rollout |
| DoD | `*.crm.appsplatform.us` | `login.microsoftonline.us` | IL4, IL5 | ✅ |

> **GCC High note (as of April 2026):** Power Apps Code Apps has not yet been deployed to GCC High. The `pac code push` CLI command routes to the commercial Power Platform API (`api.powerplatform.com`) rather than the GCC High equivalent (`high.api.powerplatform.us`), resulting in an authentication failure. Monitor the [Power Platform GCC High feature availability page](https://learn.microsoft.com/en-us/power-platform/admin/united-states-government) for rollout status. DoD organizations can deploy via the DoD Power Platform environment.

---

## Dataverse Security Model

### Table Ownership Model

All six Power Planner tables use **Organization-owned** records. This means:

- Records are not owned by individual users or business units
- Access is governed entirely by security roles (not ownership chains)
- There are no implicit "owner can always access" exceptions
- Administrators have full visibility and control over all records

**Tables:**

| Table | Logical Name | Ownership |
|---|---|---|
| Plans | `pplanner_plan` | Organization |
| Buckets | `pplanner_bucket` | Organization |
| Tasks | `pplanner_task` | Organization |
| Task Assignments | `pplanner_taskassignment` | Organization |
| Comments | `pplanner_comment` | Organization |
| Checklist Items | `pplanner_checklistitem` | Organization |

### Business Units

By default, all users and data reside in the root business unit of the environment. For organizations requiring departmental isolation (e.g., separate teams cannot see each other's plans), a multi-business-unit structure can be implemented:

- Each department maps to a Dataverse business unit
- Security roles are scoped to `Business Unit` or `User` depth
- Plans and tasks created within a business unit context become visible only to members of that unit

This is an optional configuration requiring custom role definition and user assignment; it is not enabled in the default deployment.

### Security Roles

The default deployment defines three baseline security roles. These should be created manually in the Power Platform Admin Center or provisioned via solution import.

#### Power Planner — User

Intended for general task contributors.

| Table | Create | Read | Write | Delete | Append | Append To |
|---|---|---|---|---|---|---|
| `pplanner_plan` | — | Organization | — | — | — | Organization |
| `pplanner_bucket` | — | Organization | — | — | — | Organization |
| `pplanner_task` | Organization | Organization | Organization | User | Organization | Organization |
| `pplanner_taskassignment` | Organization | Organization | Organization | User | Organization | Organization |
| `pplanner_comment` | Organization | Organization | User | User | Organization | Organization |
| `pplanner_checklistitem` | Organization | Organization | Organization | User | Organization | Organization |

#### Power Planner — Plan Manager

Intended for plan owners who need to create and modify plans and buckets.

| Table | Create | Read | Write | Delete | Append | Append To |
|---|---|---|---|---|---|---|
| `pplanner_plan` | Organization | Organization | Organization | Organization | Organization | Organization |
| `pplanner_bucket` | Organization | Organization | Organization | Organization | Organization | Organization |
| `pplanner_task` | Organization | Organization | Organization | Organization | Organization | Organization |
| `pplanner_taskassignment` | Organization | Organization | Organization | Organization | Organization | Organization |
| `pplanner_comment` | Organization | Organization | Organization | Organization | Organization | Organization |
| `pplanner_checklistitem` | Organization | Organization | Organization | Organization | Organization | Organization |

#### Power Planner — Administrator

Full privileges. Intended for system administrators.

All tables: Create / Read / Write / Delete / Append / Append To at **Organization** depth.

### Field-Level Security

Field-level security (FLS) is not enabled in the default deployment. All columns on all tables are accessible to any user with table-level read rights.

FLS can be applied to sensitive columns (e.g., task descriptions containing PII) using Dataverse **Field Security Profiles**. This requires:
1. Enabling field-level security on the target column in the table editor
2. Creating a Field Security Profile with the appropriate read/write/create permissions
3. Assigning the profile to the relevant security roles or users

---

## Access Control

### Role-Based Access Control (RBAC)

Access to Power Planner is controlled entirely by Dataverse security roles. Users without an assigned Power Planner role receive no access to any Power Planner table, regardless of their Power Platform license.

Assignment process:
1. Navigate to Power Platform Admin Center → **[your environment]** → **Settings** → **Users + Permissions** → **Security Roles**
2. Assign the appropriate Power Planner role to each user or Entra ID security group

### Plan and Task Ownership Model

Power Planner uses application-layer ownership tracking, not Dataverse record ownership:

- **Plans** store a `pplanner_ownerid` column (GUID of the creating user from `systemuser`)
- **Tasks** store a `pplanner_assignedtouserid` column for primary assignee
- **Task Assignments** table (`pplanner_taskassignment`) supports many-to-many assignment (one task → many users)

Currently, the application does not enforce row-level isolation by plan owner — all users with the User role can read all plans. To restrict plan visibility by creator or team membership, implement a **Dataverse Hierarchy Security** or a **Sharing** model, or use a custom `pplanner_team` lookup to scope queries with OData filters at the API layer.

### Sharing Model

Dataverse record sharing (`GrantAccess` API) is not used in the default deployment. All access is role-based at the table scope. Sharing can be layered on top if per-record sharing is required (e.g., a plan owner explicitly shares a plan with another user), but this adds operational complexity and is not recommended for initial deployment.

---

## Identity & Authentication

### Microsoft Entra ID Integration

Power Planner uses the Power Apps Code App SDK (`@microsoft/power-apps`) to acquire the current user's identity at runtime. The SDK calls `getContext()` which returns:

```typescript
{
  userId: string;   // Dataverse systemuser GUID
  name: string;     // Display name from Entra ID
}
```

No OAuth flows, no MSAL configuration, and no client credentials are managed by the application. Authentication is fully delegated to the Power Apps host runtime, which handles token acquisition, refresh, and session management.

### Authentication Flow

```
1. User navigates to Power Planner app URL
2. Power Platform enforces Entra ID authentication (redirect if not authenticated)
3. Entra ID issues token scoped to Dataverse resource
4. Power Apps runtime passes identity context to the Code App via SDK
5. Application uses systemuser GUID for all user-attributed operations
```

### Government Cloud Considerations

Power Planner runs on commercial and sovereign cloud deployments without modification. For organizations on **GCC** or **GCC High**, the authentication authority and Dataverse endpoint differ (see the Cloud Deployment Options table above), but the application behavior, security model, and role structure are identical.

Conditional Access policies, MFA requirements, and device compliance checks configured in the organization's Entra ID tenant are automatically enforced — no application-level configuration is required regardless of cloud tier.

**Supported authentication factors:**
- Password + MFA (authenticator app, FIDO2, certificate-based)
- Windows Hello for Business
- PIV/CAC-based certificate authentication (via Entra ID CBA)

---

## Data Protection

### Data Residency

All Power Planner data is stored in Dataverse within your Power Platform environment. Data residency is determined by the geography and cloud tier of the environment — not by the application itself. Commercial environments store data in the region selected at environment creation. GCC and GCC High environments store data within the continental United States on dedicated government cloud infrastructure.

No data is processed by or transmitted to endpoints outside the Power Platform environment boundary during normal application operation.

### Encryption at Rest

Dataverse encrypts all stored data using **AES-256** with Microsoft-managed keys. Customer-managed key (CMK) support is available for environments where key sovereignty is required. CMK is configured at the Power Platform environment level and applies to all Dataverse tables, including Power Planner tables.

**To enable CMK:**
- Power Platform Admin Center → **Environments** → **[your environment]** → **Encryption**
- Provide an Azure Key Vault key URI from the same cloud region as your environment

### Encryption in Transit

All communication between the client browser and Power Platform services uses **TLS 1.2** minimum. TLS 1.0 and 1.1 are disabled on all Power Platform endpoints. Certificate validation is enforced; the application does not implement certificate pinning (handled by the browser/OS trust store).

### Audit Logging

Dataverse provides native audit logging at the record and column level:

- **Table auditing** — Enable in the table editor (`pplanner_*`) to log all create/update/delete operations with user GUID, timestamp, and changed values
- **Column auditing** — Selectively audit sensitive columns (e.g., task description, status changes)
- **Audit log retention** — Configurable by environment; default 30 days, extendable
- **Access auditing** — Read access logging (disabled by default; can be enabled but has performance impact)

To enable auditing:
```
Power Platform Admin Center → [your environment] → Settings → Auditing & Logs → Start Auditing
```
Then enable auditing on each `pplanner_*` table via the Maker Portal table editor.

---

## Governance & Administration

### Environment Strategy

| Environment | Purpose | Recommended Configuration |
|---|---|---|
| **Development** | Active development and testing | Non-production, isolated from production data |
| **UAT** | User acceptance testing | Production-mirrored security roles, synthetic data |
| **Production** | Live user workloads | Full auditing, CMK, restricted admin access |

Environment promotion uses Power Platform **solutions** for structured ALM. The Power Planner application and all six Dataverse tables should be contained within a single solution (`Power Planner v1.x.x`) to enable consistent environment-to-environment migration.

### Solution Management (ALM)

The Power Planner solution should be managed as an **unmanaged solution in development** and exported as a **managed solution** for UAT and production deployment. Managed solutions prevent direct modification of components in downstream environments, enforcing that all changes flow through the development environment.

**ALM workflow:**

```
Development (unmanaged) → Export as managed → Import to UAT → Validate → Import to Production
```

Use `pac solution export` and `pac solution import` for automated pipeline deployment via the pac CLI or Azure DevOps / GitHub Actions Power Platform build tools.

### Data Loss Prevention (DLP) Policies

DLP policies are defined at the tenant or environment level in the Power Platform Admin Center. For Power Planner:

**Recommended baseline DLP policy:**
- **Business (allowed) connectors:** Dataverse, Office 365 Users, Microsoft Teams
- **Non-Business (blocked) connectors:** All third-party and non-Microsoft connectors
- **Blocked connectors:** HTTP (prevent arbitrary outbound web requests from Power Automate flows connected to Power Planner tables)

This ensures that Power Automate flows triggered by Power Planner data cannot exfiltrate data to non-approved endpoints.

---

## Compliance & Risk Considerations

### Compliance & Certifications

Power Planner's compliance posture is inherited from the Power Platform environment it runs in:

| Certification | Commercial | GCC | GCC High | DoD |
|---|---|---|---|---|
| ISO 27001 | ✅ | ✅ | ✅ | ✅ |
| SOC 1 / SOC 2 | ✅ | ✅ | ✅ | ✅ |
| FedRAMP Moderate | ✅ | ✅ | ✅ | ✅ |
| FedRAMP High | ❌ | ❌ | ✅ | ✅ |
| ITAR / DFARS | ❌ | ❌ | ✅ | ✅ |
| DoD SRG IL4 | ❌ | ❌ | ✅ | ✅ |
| DoD SRG IL5 | ❌ | ❌ | ⚠️ Config-dependent | ✅ |

Because Power Planner introduces no new endpoints or third-party services, it does not expand the compliance boundary beyond what the environment already holds. ATO packages and compliance documentation should reference the Power Platform / Dataverse service authorization documents directly.

### Least Privilege Model

The role hierarchy (User → Plan Manager → Administrator) is designed to enforce least privilege:

- The **User** role does not grant plan or bucket creation — users cannot create new planning structures without explicit elevation
- The **Plan Manager** role does not grant environment-level Power Platform administration
- No role grants access to Dataverse system tables beyond what Power Platform standard user roles already provide

All application operations use the authenticated user's Dataverse session — there is no service account or elevated execution context within the application.

### Segregation of Duties

| Duty | Recommended Role |
|---|---|
| Create/modify plans and structure | Power Planner — Plan Manager |
| Day-to-day task management | Power Planner — User |
| Manage security roles and users | Power Platform Environment Admin |
| View audit logs | Power Platform Environment Admin or Delegated Auditor |
| Export data | Power Platform Environment Admin |

Application-level users should not hold Power Platform Environment Admin rights.

### Auditing and Monitoring

Recommended monitoring configuration:

- Enable Dataverse auditing on all six `pplanner_*` tables
- Integrate Dataverse audit logs with **Microsoft Purview** (via Power Platform connector) or export to a SIEM via the Dataverse audit log API
- Configure **Power Platform Admin Center** activity logging to capture admin operations (role assignments, environment changes)
- Set up **Power Automate alerts** for anomalous activity patterns (e.g., bulk record deletion)

---

## Optional Enhancements

### Conditional Access

Entra ID Conditional Access policies can be scoped to the Power Apps application registration to enforce:

- MFA on every session
- Compliant device requirement (Intune enrollment)
- Named location restrictions (on-network or VPN required)
- Session frequency controls (re-authenticate every N hours)

Conditional Access is configured in the Entra ID admin center and applies transparently to Power Planner without application code changes.

### Microsoft Purview Integration

For environments requiring classification-aware data governance:

- **Purview Information Protection** — Apply sensitivity labels to Dataverse environments to classify Power Planner data at the container level
- **Purview Compliance Manager** — Reference Power Platform's FedRAMP High control mappings in assessment templates
- **Purview Audit** — Aggregate Dataverse audit logs with Microsoft 365 audit logs for unified investigative queries

### Row-Level Security Enhancements

If plan-level isolation is required (users should only see plans they are a member of):

1. Add a `pplanner_planmember` junction table (plan × systemuser)
2. Modify API queries to filter by current user's GUID against membership records
3. Optionally implement a Dataverse **Custom Access Team** template per plan for Dataverse-native row sharing

This enhancement requires application code changes to the `src/api/plans.ts` query layer and a new Dataverse table.

---

*Power Planner is developed and maintained by Microsoft Industry Solutions Delivery.*  
*For security review questions or vulnerability disclosure, contact your Microsoft account team.*  
*Last updated: April 2026*
