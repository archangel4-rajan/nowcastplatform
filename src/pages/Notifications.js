import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TYPE_ICONS = {
  trade: '\uD83D\uDCC8',
  subscription: '\uD83D\uDD14',
  system: '\u2699\uFE0F',
  milestone: '\uD83C\uDFC6',
};

const TYPE_LABELS = {
  trade: 'Trade',
  subscription: 'Subscription',
  system: 'System',
  milestone: 'Milestone',
};

function groupByDate(notifications) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups = { Today: [], Yesterday: [], Earlier: [] };
  notifications.forEach((n) => {
    const d = new Date(n.created_at);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups.Today.push(n);
    else if (d.getTime() === yesterday.getTime()) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  });
  return groups;
}

function Notifications() {
  const { notifications, markAsRead, markAllAsRead, refreshNotifications } = useAuth();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const filtered =
    filter === 'all'
      ? notifications
      : notifications.filter((n) => n.type === filter);

  const grouped = groupByDate(filtered);

  function handleClick(n) {
    markAsRead(n.id);
    if (n.strategy_id) {
      navigate(`/strategy/${n.strategy_id}`);
    }
  }

  return (
    <div className="page">
      <div className="marketplace-header-compact">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h1>Notifications</h1>
            {notifications.some((n) => !n.read) && (
              <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="section" style={{ paddingTop: '32px' }}>
        <div className="container">
          <div className="notification-filters">
            {['all', 'trade', 'system', 'milestone', 'subscription'].map((t) => (
              <button
                key={t}
                className={`notification-filter-btn ${filter === t ? 'active' : ''}`}
                onClick={() => setFilter(t)}
              >
                {t === 'all' ? 'All' : TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state-box">
              <h3>No notifications</h3>
              <p>You're all caught up! Check back later for updates.</p>
            </div>
          ) : (
            Object.entries(grouped).map(
              ([label, items]) =>
                items.length > 0 && (
                  <div key={label} className="notification-group">
                    <h3 className="notification-group-label">{label}</h3>
                    <div className="notification-list">
                      {items.map((n) => (
                        <div
                          key={n.id}
                          className={`notification-page-item ${!n.read ? 'unread' : ''}`}
                          onClick={() => handleClick(n)}
                        >
                          <span className="notification-type-icon">
                            {TYPE_ICONS[n.type] || '\uD83D\uDD14'}
                          </span>
                          <div className="notification-page-item-content">
                            <div className="notification-page-item-header">
                              <span className={`notification-type-badge notification-type-${n.type}`}>
                                {TYPE_LABELS[n.type]}
                              </span>
                              <span className="notification-time">
                                {new Date(n.created_at).toLocaleString()}
                              </span>
                            </div>
                            <span className="notification-page-item-title">{n.title}</span>
                            <span className="notification-page-item-message">{n.message}</span>
                          </div>
                          {!n.read && <span className="notification-unread-dot"></span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )
            )
          )}
        </div>
      </section>
    </div>
  );
}

export default Notifications;
