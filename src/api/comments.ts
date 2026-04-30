import type { DataClient } from './dataverse';
import { unwrap } from './dataverse';
import type { Comment } from '../types';
import { TABLES } from '../types';

const SELECT = ['pplanner_commentid', 'pplanner_content', '_pplanner_taskid_value', '_pplanner_authorid_value', 'createdon'];

export async function fetchComments(client: DataClient, taskId: string): Promise<Comment[]> {
  const result = await client.retrieveMultipleRecordsAsync<Comment>(TABLES.COMMENTS, {
    select: SELECT,
    filter: `_pplanner_taskid_value eq '${taskId}'`,
    orderBy: ['createdon asc'],
  });
  return unwrap(result);
}

export interface CreateCommentInput {
  pplanner_content: string;
  'pplanner_taskid@odata.bind': string;   // e.g. "/pplanner_tasks(<taskId>)"
  'pplanner_authorid@odata.bind': string; // e.g. "/systemusers(<userId>)"
}

export async function createComment(
  client: DataClient,
  input: CreateCommentInput,
): Promise<Comment> {
  const result = await client.createRecordAsync<CreateCommentInput, Comment>(
    TABLES.COMMENTS,
    input,
  );
  return unwrap(result);
}

export async function deleteComment(client: DataClient, commentId: string): Promise<void> {
  const result = await client.deleteRecordAsync(TABLES.COMMENTS, commentId);
  unwrap(result);
}
