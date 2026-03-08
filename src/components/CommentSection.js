import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function CommentSection({ strategyId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from('nc_comments')
      .select('*, nc_profiles(name, avatar_url)')
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: false });
    setComments(data || []);
    setLoading(false);
  }, [strategyId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('nc_comments').insert({
      user_id: user.id,
      strategy_id: strategyId,
      content: newComment.trim(),
    });
    if (!error) {
      setNewComment('');
      fetchComments();
    }
    setSubmitting(false);
  }

  async function handleUpdate(commentId) {
    if (!editContent.trim()) return;
    const { error } = await supabase
      .from('nc_comments')
      .update({ content: editContent.trim() })
      .eq('id', commentId);
    if (!error) {
      setEditingId(null);
      setEditContent('');
      fetchComments();
    }
  }

  async function handleDelete(commentId) {
    const { error } = await supabase
      .from('nc_comments')
      .delete()
      .eq('id', commentId);
    if (!error) fetchComments();
  }

  if (loading) return <div className="loading">Loading comments...</div>;

  return (
    <div className="comment-section">
      <h3>Comments ({comments.length})</h3>

      {user && (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !newComment.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      {comments.length === 0 && (
        <p className="empty-state">No comments yet. Be the first to share your thoughts.</p>
      )}

      <div className="comments-list">
        {comments.map(comment => (
          <div key={comment.id} className="comment-item">
            <div className="comment-header">
              <span className="comment-author">{comment.nc_profiles?.name || 'User'}</span>
              <span className="comment-date">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            {editingId === comment.id ? (
              <div className="comment-edit">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={3}
                />
                <div className="comment-edit-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(comment.id)}>
                    Save
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="comment-content">{comment.content}</p>
                {user?.id === comment.user_id && (
                  <div className="comment-actions">
                    <button
                      className="btn-text"
                      onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                    >
                      Edit
                    </button>
                    <button className="btn-text btn-text-danger" onClick={() => handleDelete(comment.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CommentSection;
