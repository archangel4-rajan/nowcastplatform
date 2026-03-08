import React from 'react';
import { Link } from 'react-router-dom';
import TagBadge from './TagBadge';

function StrategyCard({ strategy, subscriberCount }) {
  const riskColors = {
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high',
  };

  return (
    <Link to={`/strategy/${strategy.id}`} className="strategy-card-link">
      <div className="strategy-card">
        <div className="strategy-card-header">
          <h3 className="strategy-card-title">{strategy.title}</h3>
          {strategy.risk_level && (
            <span className={`risk-badge ${riskColors[strategy.risk_level]}`}>
              {strategy.risk_level}
            </span>
          )}
        </div>
        <p className="strategy-card-creator">
          by {strategy.nc_profiles?.name || 'Unknown'}
        </p>
        <p className="strategy-card-description">
          {strategy.description?.slice(0, 120)}{strategy.description?.length > 120 ? '...' : ''}
        </p>
        <div className="strategy-card-tags">
          {strategy.tags?.map(tag => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
        <div className="strategy-card-footer">
          <span className="strategy-card-subscribers">
            {subscriberCount ?? 0} subscriber{(subscriberCount ?? 0) !== 1 ? 's' : ''}
          </span>
          <span className="strategy-card-price">
            {strategy.subscription_price > 0
              ? `$${Number(strategy.subscription_price).toFixed(0)}/mo`
              : 'Free'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default StrategyCard;
