import React from 'react';

function PortfolioTable({ holdings, onRemove }) {
  if (!holdings || holdings.length === 0) {
    return <p className="empty-state">No holdings yet.</p>;
  }

  return (
    <div className="portfolio-table-wrapper">
      <table className="portfolio-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Type</th>
            <th>Allocation %</th>
            <th>Entry Price</th>
            <th>Notes</th>
            {onRemove && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {holdings.map(h => (
            <tr key={h.id}>
              <td className="ticker-cell">{h.ticker}</td>
              <td>{h.asset_type || '-'}</td>
              <td>{Number(h.allocation_pct).toFixed(1)}%</td>
              <td>{h.entry_price ? `$${Number(h.entry_price).toFixed(2)}` : '-'}</td>
              <td>{h.notes || '-'}</td>
              {onRemove && (
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => onRemove(h)}>
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PortfolioTable;
