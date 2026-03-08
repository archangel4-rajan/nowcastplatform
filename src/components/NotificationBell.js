import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TYPE_ICONS = {
  trade: '\uD83D\uDCC8',
  subscription: '\uD83D\uDD14',
  system: '\u2699\uFE0F',
  milestone: '\uD83C\uDFC6',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleNotificationClick(n) {
    markAsRead(n.id);
    setOpen(false);
    if (n.strategy_id) {
      navigate(`/strategy/${n.strategy_id}`);
    }
  }

  const recent = (notifications || []).slice(0, 20);

  return (
    <div className="notification-bell" ref={ref}>
      <button
        className="notification-bell-btn"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <span role="img" aria-label="bell">{'\uD83D\uDD14'}</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span className="notification-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button
                className="btn-text"
                onClick={() => markAllAsRead()}
              >
                Mark all as read
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="notification-dropdown-empty">No notifications yet</div>
          ) : (
            <div className="notification-dropdown-list">
              {recent.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <span className="notification-type-icon">
                    {TYPE_ICONS[n.type] || '\uD83D\uDD14'}
                  </span>
                  <div className="notification-item-content">
                    <span className="notification-item-title">{n.title}</span>
                    <span className="notification-item-message">
                      {n.message?.length > 80
                        ? n.message.slice(0, 80) + '...'
                        : n.message}
                    </span>
                  </div>
                  <span className="notification-time">{timeAgo(n.created_at)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="notification-dropdown-footer">
            <button
              className="btn-text"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
