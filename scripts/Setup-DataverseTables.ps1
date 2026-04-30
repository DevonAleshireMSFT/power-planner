<#
.SYNOPSIS
    Provisions all Power Planner Dataverse tables, columns, and relationships.

.DESCRIPTION
    Creates the six custom tables required by the Power Planner Code App
    and publishes the customizations. Safe to re-run — existing tables are skipped.

    Requires the Az PowerShell module:
        Install-Module Az -Scope CurrentUser

.PARAMETER EnvironmentUrl
    Your Dataverse environment URL.
    GCCH example : https://yourorg.crm.microsoftdynamics.us
    Commercial    : https://yourorg.crm.dynamics.com

.PARAMETER PublisherPrefix
    Your publisher prefix WITHOUT the trailing underscore.
    Must match the prefix used in the TypeScript source (src/types/index.ts).
    Default: pp

    To find your publisher prefix:
      Power Apps Maker Portal → Settings → Customizations → Publishers
      Copy the "Prefix" value (e.g. "contoso", "myorg", "pp")

.PARAMETER AzureEnvironment
    Azure cloud environment.  Default: AzureUSGovernment (GCCH)
    Use "AzureCloud" for commercial Power Platform.

.PARAMETER TenantId
    Optional. Entra ID tenant GUID. Auto-detected if omitted.

.EXAMPLE
    # GCCH with default pplanner_ prefix
    .\Setup-DataverseTables.ps1 -EnvironmentUrl "https://myorg.crm.microsoftdynamics.us"

.EXAMPLE
    # Commercial with custom prefix
    .\Setup-DataverseTables.ps1 `
        -EnvironmentUrl "https://myorg.crm.dynamics.com" `
        -PublisherPrefix "contoso" `
        -AzureEnvironment "AzureCloud"
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory, HelpMessage = "Dataverse environment URL")]
    [string]$EnvironmentUrl,

    [Parameter(HelpMessage = "Publisher prefix (no underscore). Must match src/types/index.ts")]
    [string]$PublisherPrefix = "pplanner",

    [Parameter()]
    [ValidateSet("AzureUSGovernment", "AzureCloud", "AzureUSGovernmentDoD")]
    [string]$AzureEnvironment = "AzureUSGovernment",

    [Parameter()]
    [string]$TenantId = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── Validate Az module ──────────────────────────────────────────────────────
if (-not (Get-Module -ListAvailable -Name Az.Accounts)) {
    Write-Error @"
Az PowerShell module not found. Install it first:

    Install-Module Az -Scope CurrentUser -Force

Then re-run this script.
"@
    exit 1
}

$baseUrl  = $EnvironmentUrl.TrimEnd('/')
$apiBase  = "$baseUrl/api/data/v9.2"
$px       = $PublisherPrefix      # short alias used throughout
$script:headers = @{}

# ─── Helpers: metadata objects ───────────────────────────────────────────────

function Get-Label([string]$text) {
    @{
        "@odata.type"    = "Microsoft.Dynamics.CRM.Label"
        "LocalizedLabels" = @(@{
            "@odata.type"  = "Microsoft.Dynamics.CRM.LocalizedLabel"
            "Label"        = $text
            "LanguageCode" = 1033
        })
    }
}

function Get-RequiredLevel([string]$level = "None") {
    @{
        "Value"                       = $level
        "CanBeChanged"                = $true
        "ManagedPropertyLogicalName"  = "canmodifyrequirementlevelsettings"
    }
}

function Get-StringAttr([string]$schema, [string]$display, [int]$maxLen,
                         [string]$required = "None", [bool]$isPrimary = $false) {
    $a = @{
        "@odata.type"         = "Microsoft.Dynamics.CRM.StringAttributeMetadata"
        "SchemaName"          = $schema
        "AttributeType"       = "String"
        "AttributeTypeName"   = @{ "Value" = "StringType" }
        "RequiredLevel"       = (Get-RequiredLevel $required)
        "MaxLength"           = $maxLen
        "FormatName"          = @{ "Value" = "Text" }
        "DisplayName"         = (Get-Label $display)
    }
    if ($isPrimary) { $a["IsPrimaryName"] = $true }
    return $a
}

function Get-MemoAttr([string]$schema, [string]$display, [int]$maxLen) {
    @{
        "@odata.type"       = "Microsoft.Dynamics.CRM.MemoAttributeMetadata"
        "SchemaName"        = $schema
        "AttributeType"     = "Memo"
        "AttributeTypeName" = @{ "Value" = "MemoType" }
        "RequiredLevel"     = (Get-RequiredLevel "None")
        "MaxLength"         = $maxLen
        "DisplayName"       = (Get-Label $display)
    }
}

function Get-DateAttr([string]$schema, [string]$display) {
    @{
        "@odata.type"        = "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata"
        "SchemaName"         = $schema
        "AttributeType"      = "DateTime"
        "AttributeTypeName"  = @{ "Value" = "DateTimeType" }
        "RequiredLevel"      = (Get-RequiredLevel "None")
        "Format"             = "DateOnly"
        "DateTimeBehavior"   = @{ "Value" = "UserLocal" }
        "DisplayName"        = (Get-Label $display)
    }
}

function Get-IntAttr([string]$schema, [string]$display, [int]$min = 0, [int]$max = 9999) {
    @{
        "@odata.type"       = "Microsoft.Dynamics.CRM.IntegerAttributeMetadata"
        "SchemaName"        = $schema
        "AttributeType"     = "Integer"
        "AttributeTypeName" = @{ "Value" = "IntegerType" }
        "RequiredLevel"     = (Get-RequiredLevel "None")
        "MinValue"          = $min
        "MaxValue"          = $max
        "DisplayName"       = (Get-Label $display)
    }
}

function Get-BoolAttr([string]$schema, [string]$display, [bool]$default = $false) {
    @{
        "@odata.type"       = "Microsoft.Dynamics.CRM.BooleanAttributeMetadata"
        "SchemaName"        = $schema
        "AttributeType"     = "Boolean"
        "AttributeTypeName" = @{ "Value" = "BooleanType" }
        "RequiredLevel"     = (Get-RequiredLevel "None")
        "DefaultValue"      = $default
        "OptionSet"         = @{
            "@odata.type" = "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata"
            "TrueOption"  = @{ "Value" = 1; "Label" = (Get-Label "Yes") }
            "FalseOption" = @{ "Value" = 0; "Label" = (Get-Label "No")  }
        }
        "DisplayName"       = (Get-Label $display)
    }
}

# ─── Helpers: API calls ───────────────────────────────────────────────────────

function Invoke-DV {
    param(
        [string]$Method,
        [string]$Path,
        $Body = $null
    )

    $params = @{
        Uri     = "$apiBase$Path"
        Method  = $Method
        Headers = $script:headers
    }

    if ($null -ne $Body) {
        $params["Body"]        = ($Body | ConvertTo-Json -Depth 20 -Compress)
        $params["ContentType"] = "application/json; charset=utf-8"
    }

    try {
        return Invoke-RestMethod @params
    }
    catch {
        $code = 0
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
        }
        if ($code -eq 409) {
            Write-Host "    Already exists — skipped." -ForegroundColor DarkYellow
            return $null
        }

        # 0x80072551 = relationship SchemaName/NavigationPropertyName not unique
        # This means the relationship already exists from a previous run.
        $raw = $_.ErrorDetails.Message
        if ($raw -and ($raw | ConvertFrom-Json -ErrorAction SilentlyContinue).error.code -eq '0x80072551') {
            Write-Host "    Already exists — skipped." -ForegroundColor DarkYellow
            return $null
        }

        # Surface the Dataverse error message if available
        $raw = $_.ErrorDetails.Message
        if ($raw) {
            try {
                $parsed = $raw | ConvertFrom-Json
                Write-Warning "Dataverse: $($parsed.error.message)"
            } catch { Write-Warning $raw }
        } else {
            Write-Warning $_.Exception.Message
        }
        throw
    }
}

function Test-EntityExists([string]$logicalName) {
    try {
        $r = Invoke-DV "GET" "/EntityDefinitions?`$filter=LogicalName eq '$logicalName'&`$select=LogicalName"
        return ($r.value.Count -gt 0)
    } catch { return $false }
}

function Test-RelationshipExists([string]$schemaName) {
    try {
        $r = Invoke-DV "GET" "/RelationshipDefinitions?`$filter=SchemaName eq '$schemaName'&`$select=SchemaName"
        return ($r.value.Count -gt 0)
    } catch { return $false }
}

# ─── Core: create entity ──────────────────────────────────────────────────────

function New-DvEntity {
    param(
        [string]$SchemaName,
        [string]$DisplaySingular,
        [string]$DisplayPlural,
        [array] $Attributes,
        [string]$Ownership = "UserOwned"
    )

    $logical = $SchemaName.ToLower()
    Write-Host "  Table: $logical" -NoNewline

    if (Test-EntityExists $logical) {
        Write-Host " — already exists, skipped." -ForegroundColor DarkYellow
        return
    }

    $body = @{
        "@odata.type"          = "Microsoft.Dynamics.CRM.EntityMetadata"
        "SchemaName"           = $SchemaName
        "DisplayName"          = (Get-Label $DisplaySingular)
        "DisplayCollectionName"= (Get-Label $DisplayPlural)
        "HasNotes"             = $false
        "HasActivities"        = $false
        "OwnershipType"        = $Ownership
        "Attributes"           = $Attributes
    }

    Invoke-DV "POST" "/EntityDefinitions" $body | Out-Null
    Write-Host " — created." -ForegroundColor Green
}

# ─── Core: create 1:N relationship (creates lookup column on child entity) ───

function New-DvRelationship {
    param(
        [string]$SchemaName,
        [string]$ReferencedEntity,   # parent (1 side)
        [string]$ReferencingEntity,  # child  (N side)
        [string]$LookupSchema,       # schema name of the lookup column on the child
        [string]$LookupDisplay,
        [string]$Required     = "None",
        # Cascade action when parent is deleted:
        #   Cascade    = delete child records
        #   RemoveLink = set lookup to null
        #   Restrict   = prevent parent deletion while children exist
        [string]$DeleteAction = "Cascade"
    )

    Write-Host "  Relationship: $SchemaName" -NoNewline

    if (Test-RelationshipExists $SchemaName) {
        Write-Host "    Already exists — skipped." -ForegroundColor DarkYellow
        return
    }

    $body = @{
        "@odata.type"        = "Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata"
        "SchemaName"         = $SchemaName
        "ReferencedEntity"   = $ReferencedEntity
        "ReferencingEntity"  = $ReferencingEntity
        "Lookup"             = @{
            "@odata.type"  = "Microsoft.Dynamics.CRM.LookupAttributeMetadata"
            "SchemaName"   = $LookupSchema
            "DisplayName"  = (Get-Label $LookupDisplay)
            "RequiredLevel"= (Get-RequiredLevel $Required)
        }
        "AssociatedMenuConfiguration" = @{
            "Behavior" = "DoNotDisplay"
            "Group"    = "Details"
            "Label"    = @{
                "@odata.type"    = "Microsoft.Dynamics.CRM.Label"
                "LocalizedLabels"= @()
            }
            "Order"    = $null
        }
        "CascadeConfiguration" = @{
            "Assign"   = "NoCascade"
            "Delete"   = $DeleteAction
            "Merge"    = "NoCascade"
            "Reparent" = "NoCascade"
            "Share"    = "NoCascade"
            "Unshare"  = "NoCascade"
        }
    }

    Invoke-DV "POST" "/RelationshipDefinitions" $body | Out-Null
    Write-Host " — created." -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

# ─── 1. Authenticate ──────────────────────────────────────────────────────────
Write-Host "`nAuthenticating to $AzureEnvironment..." -ForegroundColor Cyan

$connectParams = @{ Environment = $AzureEnvironment }
if ($TenantId) { $connectParams["TenantId"] = $TenantId }
Connect-AzAccount @connectParams | Out-Null

$tokenObj = Get-AzAccessToken -ResourceUrl "$baseUrl/"
$script:headers = @{
    "Authorization"   = "Bearer $($tokenObj.Token)"
    "OData-MaxVersion"= "4.0"
    "OData-Version"   = "4.0"
    "Accept"          = "application/json"
}

Write-Host "Authenticated. Environment: $baseUrl" -ForegroundColor Green
Write-Host "Publisher prefix: ${px}_`n"

# ─── 2. Verify connectivity ───────────────────────────────────────────────────
Write-Host "Verifying Dataverse connectivity..." -ForegroundColor Cyan
try {
    Invoke-DV "GET" "/WhoAmI" | Out-Null
    Write-Host "Connection OK.`n" -ForegroundColor Green
} catch {
    Write-Error "Cannot reach Dataverse at $baseUrl. Check the URL and your permissions."
    exit 1
}

# ─── 3. Create Tables ─────────────────────────────────────────────────────────
Write-Host "Creating tables..." -ForegroundColor Cyan

# ── ${px}_plan ────────────────────────────────────────────────────────────────
New-DvEntity "${px}_Plan" "Plan" "Plans" @(
    (Get-StringAttr "${px}_Name"        "Plan Name"   200  "ApplicationRequired" $true)
    (Get-MemoAttr   "${px}_Description" "Description" 2000)
    (Get-DateAttr   "${px}_StartDate"   "Start Date")
    (Get-DateAttr   "${px}_EndDate"     "End Date")
)

# ── ${px}_bucket ──────────────────────────────────────────────────────────────
New-DvEntity "${px}_Bucket" "Bucket" "Buckets" @(
    (Get-StringAttr "${px}_Name"  "Bucket Name"  200 "ApplicationRequired" $true)
    (Get-IntAttr    "${px}_Order" "Display Order" 0  9999)
)

# ── ${px}_task ────────────────────────────────────────────────────────────────
#   pplanner_status   : 0=Not Started | 1=In Progress | 2=Completed  (matches TASK_STATUS in types/index.ts)
#   pplanner_priority : 0=Low | 1=Medium | 2=High | 3=Urgent         (matches TASK_PRIORITY in types/index.ts)
New-DvEntity "${px}_Task" "Task" "Tasks" @(
    (Get-StringAttr "${px}_Title"       "Title"       300  "ApplicationRequired" $true)
    (Get-MemoAttr   "${px}_Description" "Description" 4000)
    (Get-DateAttr   "${px}_StartDate"   "Start Date")
    (Get-DateAttr   "${px}_DueDate"     "Due Date")
    (Get-IntAttr    "${px}_Status"      "Status"   0 2)
    (Get-IntAttr    "${px}_Priority"    "Priority" 0 3)
)

# ── ${px}_taskassignment ──────────────────────────────────────────────────────
#   pplanner_name: placeholder primary name, not used by the app
New-DvEntity "${px}_TaskAssignment" "Task Assignment" "Task Assignments" @(
    (Get-StringAttr "${px}_Name" "Name" 100 "None" $true)
)

# ── ${px}_comment ─────────────────────────────────────────────────────────────
#   pplanner_name: placeholder primary name, not used by the app
New-DvEntity "${px}_Comment" "Comment" "Comments" @(
    (Get-StringAttr "${px}_Name"    "Name"    100  "None" $true)
    (Get-MemoAttr   "${px}_Content" "Content" 4000)
)

# ── ${px}_checklistitem ───────────────────────────────────────────────────────
New-DvEntity "${px}_ChecklistItem" "Checklist Item" "Checklist Items" @(
    (Get-StringAttr "${px}_Title"      "Title"        200 "ApplicationRequired" $true)
    (Get-BoolAttr   "${px}_IsComplete" "Is Complete"  $false)
    (Get-IntAttr    "${px}_Order"      "Display Order" 0 9999)
)

# ─── 4. Create Relationships (lookup columns) ─────────────────────────────────
Write-Host "`nCreating relationships..." -ForegroundColor Cyan

#
# Naming convention: {px}_{parent}_{child}[_{disambiguator}]
# LookupSchema must match the odata.bind key used in the TypeScript API layer:
#   buckets.ts  : 'pplanner_planid@odata.bind'     → LookupSchema: ${px}_PlanId
#   tasks.ts    : 'pplanner_planid@odata.bind'     → LookupSchema: ${px}_PlanId
#   tasks.ts    : 'pplanner_bucketid@odata.bind'   → LookupSchema: ${px}_BucketId
#   comments.ts : 'pplanner_taskid@odata.bind'     → LookupSchema: ${px}_TaskId
#   comments.ts : 'pplanner_authorid@odata.bind'   → LookupSchema: ${px}_AuthorId
#   checklistItems.ts: 'pplanner_taskid@odata.bind'→ LookupSchema: ${px}_TaskId
#   (taskassignments) 'pplanner_taskid@odata.bind' → LookupSchema: ${px}_TaskId
#   (taskassignments) 'pplanner_assigneeid@odata.bind' → LookupSchema: ${px}_AssigneeId
#

# Bucket → Plan  (required; cascade: delete bucket if plan deleted)
New-DvRelationship `
    "${px}_plan_${px}_bucket" `
    "${px}_plan" "${px}_bucket" `
    "${px}_PlanId" "Plan" `
    -Required "ApplicationRequired" -DeleteAction "Cascade"

# Task → Plan  (required; cascade: delete task if plan deleted)
New-DvRelationship `
    "${px}_plan_${px}_task" `
    "${px}_plan" "${px}_task" `
    "${px}_PlanId" "Plan" `
    -Required "ApplicationRequired" -DeleteAction "Cascade"

# Task → Bucket  (optional; RemoveLink: clear field if bucket deleted)
New-DvRelationship `
    "${px}_bucket_${px}_task" `
    "${px}_bucket" "${px}_task" `
    "${px}_BucketId" "Bucket" `
    -Required "None" -DeleteAction "RemoveLink"

# TaskAssignment → Task  (required; cascade delete)
New-DvRelationship `
    "${px}_task_${px}_taskassignment" `
    "${px}_task" "${px}_taskassignment" `
    "${px}_TaskId" "Task" `
    -Required "ApplicationRequired" -DeleteAction "Cascade"

# TaskAssignment → SystemUser (assignee)  (RemoveLink: preserve assignments if user removed)
New-DvRelationship `
    "${px}_systemuser_${px}_taskassignment_assignee" `
    "systemuser" "${px}_taskassignment" `
    "${px}_AssigneeId" "Assigned To" `
    -Required "ApplicationRequired" -DeleteAction "RemoveLink"

# Comment → Task  (required; cascade delete)
New-DvRelationship `
    "${px}_task_${px}_comment" `
    "${px}_task" "${px}_comment" `
    "${px}_TaskId" "Task" `
    -Required "ApplicationRequired" -DeleteAction "Cascade"

# Comment → SystemUser (author)  (RemoveLink: preserve comments if user removed)
New-DvRelationship `
    "${px}_systemuser_${px}_comment_author" `
    "systemuser" "${px}_comment" `
    "${px}_AuthorId" "Author" `
    -Required "ApplicationRequired" -DeleteAction "RemoveLink"

# ChecklistItem → Task  (required; cascade delete)
New-DvRelationship `
    "${px}_task_${px}_checklistitem" `
    "${px}_task" "${px}_checklistitem" `
    "${px}_TaskId" "Task" `
    -Required "ApplicationRequired" -DeleteAction "Cascade"

# ─── 5. Publish all customizations ───────────────────────────────────────────
Write-Host "`nPublishing customizations..." -ForegroundColor Cyan
# PublishAllXml requires Content-Type: application/json even though the body is empty.
# Pass an empty hashtable so Invoke-DV sets the header correctly.
Invoke-DV "POST" "/PublishAllXml" @{} | Out-Null
Write-Host "Published." -ForegroundColor Green

# ─── 6. Summary ───────────────────────────────────────────────────────────────
Write-Host @"

╔══════════════════════════════════════════════════════════╗
║  Dataverse setup complete                                ║
╠══════════════════════════════════════════════════════════╣
║  Tables created (prefix: ${px}_)                        
║    ${px}_plan              Plans / projects              
║    ${px}_bucket            Kanban buckets                
║    ${px}_task              Tasks                         
║    ${px}_taskassignment    Task ↔ user assignments       
║    ${px}_comment           Per-task comments             
║    ${px}_checklistitem     Checklist subtasks            
╠══════════════════════════════════════════════════════════╣
║  Next steps:                                             
║  1. Verify tables in Power Apps Maker Portal             
║  2. Create a custom security role with CRUD on all six   
║  3. Run  pac code init  to generate power.config.json    
║  4. Update DataSourcesInfo in App.tsx                    
╚══════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green
