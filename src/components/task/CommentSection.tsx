import { useState, useEffect } from 'react';
import type { DataClient } from '../../api/dataverse';
import type { Comment } from '../../types';
import { fetchComments, createComment, deleteComment } from '../../api/comments';

interface CommentSectionProps {
  taskId: string;
  client: DataClient;
  currentUserId: string;
  currentUserName: string;
}

export function CommentSection({
  taskId,
  client,
  currentUserId,
  currentUserName,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments(client, taskId)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [client, taskId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      const created = await createComment(client, {
        pplanner_content: content.trim(),
        'pplanner_taskid@odata.bind': `/pplanner_tasks(${taskId})`,
        'pplanner_authorid@odata.bind': `/systemusers(${currentUserId})`,
      });
      setComments((prev) => [...prev, created]);
      setContent('');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    await deleteComment(client, commentId);
    setComments((prev) => prev.filter((c) => c.pplanner_commentid !== commentId));
  }

  if (loading) return <div className="comments-loading">Loading comments…</div>;

  return (
    <section className="comments-section" aria-label="Comments">
      <h4 className="section-title">Comments</h4>

      <ul className="comments-list">
        {comments.length === 0 && (
          <li className="comments-empty">No comments yet.</li>
        )}
        {comments.map((c) => (
          <li key={c.pplanner_commentid} className="comment-item">
            <div className="comment-header">
              <strong className="comment-author">
                {c.author?.fullname ?? 'Unknown'}
              </strong>
              <span className="comment-date">
                {new Date(c.createdon).toLocaleString()}
              </span>
              {c._pplanner_authorid_value === currentUserId && (
                <button
                  className="comment-delete"
                  onClick={() => handleDelete(c.pplanner_commentid)}
                  aria-label="Delete comment"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="comment-content">{c.pplanner_content}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={handlePost} className="comment-form">
        <textarea
          className="form-input form-textarea comment-input"
          placeholder={`Comment as ${currentUserName}…`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          maxLength={4000}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={posting || !content.trim()}
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
      </form>
    </section>
  );
}
