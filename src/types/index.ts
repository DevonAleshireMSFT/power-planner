// ============================================================
// Dataverse Entity Interfaces
// Table prefix: pplanner_ (custom publisher prefix — adjust to match yours)
// ============================================================

export interface Plan {
  pplanner_planid: string;
  pplanner_name: string;
  pplanner_description?: string;
  pplanner_startdate?: string;
  pplanner_enddate?: string;
  _ownerid_value?: string;
  ownerid_fullname?: string;
  statecode: number;
  statuscode: number;
  createdon?: string;
  modifiedon?: string;
}

export interface Bucket {
  pplanner_bucketid: string;
  pplanner_name: string;
  pplanner_order: number;
  _pplanner_planid_value: string;
  createdon?: string;
}

export interface Task {
  pplanner_taskid: string;
  pplanner_title: string;
  pplanner_description?: string;
  pplanner_startdate?: string;
  pplanner_duedate?: string;
  /** 0 = Not Started | 1 = In Progress | 2 = Completed */
  pplanner_status: number;
  /** 0 = Low | 1 = Medium | 2 = High | 3 = Urgent */
  pplanner_priority: number;
  _pplanner_planid_value: string;
  _pplanner_bucketid_value?: string;
  statecode: number;
  statuscode: number;
  createdon?: string;
  modifiedon?: string;
  // Expanded navigation
  assignees?: SystemUser[];
}

export interface SystemUser {
  systemuserid: string;
  fullname: string;
  internalemailaddress?: string;
}

export interface Comment {
  pplanner_commentid: string;
  pplanner_content: string;
  _pplanner_taskid_value: string;
  _pplanner_authorid_value: string;
  createdon: string;
  // Expanded navigation
  author?: SystemUser;
}

export interface ChecklistItem {
  pplanner_checklistitemid: string;
  pplanner_title: string;
  pplanner_iscomplete: boolean;
  pplanner_order: number;
  _pplanner_taskid_value: string;
}

export interface TaskAssignment {
  pplanner_taskassignmentid: string;
  _pplanner_taskid_value: string;
  _pplanner_assigneeid_value: string;
  // Expanded navigation
  assignee?: SystemUser;
}

// ============================================================
// App State / UI Types
// ============================================================

export type ViewMode = 'board' | 'list';

export interface AppState {
  selectedPlanId: string | null;
  viewMode: ViewMode;
  selectedTaskId: string | null;
}

// ============================================================
// Label / Color Maps
// ============================================================

export const TASK_STATUS: Record<number, string> = {
  0: 'Not Started',
  1: 'In Progress',
  2: 'Completed',
};

export const TASK_PRIORITY: Record<number, string> = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Urgent',
};

export const TASK_STATUS_COLORS: Record<number, string> = {
  0: 'var(--color-status-notstarted)',
  1: 'var(--color-status-inprogress)',
  2: 'var(--color-status-completed)',
};

export const TASK_PRIORITY_COLORS: Record<number, string> = {
  0: 'var(--color-priority-low)',
  1: 'var(--color-priority-medium)',
  2: 'var(--color-priority-high)',
  3: 'var(--color-priority-urgent)',
};

// ============================================================
// Dataverse Table Logical Names (plural entity set names)
// ============================================================

export const TABLES = {
  PLANS: 'pplanner_plans',
  BUCKETS: 'pplanner_buckets',
  TASKS: 'pplanner_tasks',
  TASK_ASSIGNMENTS: 'pplanner_taskassignments',
  COMMENTS: 'pplanner_comments',
  CHECKLIST_ITEMS: 'pplanner_checklistitems',
} as const;
