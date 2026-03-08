import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

function calculateEquityCurve(trades, startingCapital) {
  if (!trades || trades.length === 0) return [];

  // Sort trades chronologically (oldest first)
  const sorted = [...trades].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  // Group trades by ticker, match buy/sell pairs
  const byTicker = {};
  sorted.forEach((t) => {
    if (!byTicker[t.ticker]) byTicker[t.ticker] = [];
    byTicker[t.ticker].push(t);
  });

  // Build P&L events with dates
  const pnlEvents = [];
  Object.values(byTicker).forEach((tickerTrades) => {
    const buys = tickerTrades
      .filter((t) => t.direction === 'buy' || t.direction === 'cover')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const sells = tickerTrades
      .filter((t) => t.direction === 'sell' || t.direction === 'short')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const pairs = Math.min(buys.length, sells.length);
    for (let i = 0; i < pairs; i++) {
      const qty = Math.min(buys[i].quantity || 0, sells[i].quantity || 0);
      const pnl = (sells[i].price - buys[i].price) * qty;
      pnlEvents.push({
        date: sells[i].created_at,
        pnl,
      });
    }
  });

  if (pnlEvents.length === 0) return [];

  pnlEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  const curve = [
    {
      date: new Date(pnlEvents[0].date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: startingCapital,
    },
  ];

  let cumulative = startingCapital;
  pnlEvents.forEach((evt) => {
    cumulative += evt.pnl;
    curve.push({
      date: new Date(evt.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      value: Math.round(cumulative * 100) / 100,
    });
  });

  return curve;
}

function calculateMonthlyReturns(trades, startingCapital) {
  if (!trades || trades.length === 0) return [];

  const sorted = [...trades].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const byTicker = {};
  sorted.forEach((t) => {
    if (!byTicker[t.ticker]) byTicker[t.ticker] = [];
    byTicker[t.ticker].push(t);
  });

  // Build P&L events with dates
  const pnlEvents = [];
  Object.values(byTicker).forEach((tickerTrades) => {
    const buys = tickerTrades
      .filter((t) => t.direction === 'buy' || t.direction === 'cover')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const sells = tickerTrades
      .filter((t) => t.direction === 'sell' || t.direction === 'short')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const pairs = Math.min(buys.length, sells.length);
    for (let i = 0; i < pairs; i++) {
      const qty = Math.min(buys[i].quantity || 0, sells[i].quantity || 0);
      const pnl = (sells[i].price - buys[i].price) * qty;
      const d = new Date(sells[i].created_at);
      pnlEvents.push({ year: d.getFullYear(), month: d.getMonth(), pnl });
    }
  });

  if (pnlEvents.length === 0) return [];

  // Group by year-month
  const monthlyPnl = {};
  pnlEvents.forEach(({ year, month, pnl }) => {
    const key = `${year}-${month}`;
    if (!monthlyPnl[key]) monthlyPnl[key] = { year, month, pnl: 0 };
    monthlyPnl[key].pnl += pnl;
  });

  // Calculate returns as % of starting capital
  return Object.values(monthlyPnl)
    .map((m) => ({
      year: m.year,
      month: m.month,
      returnPct: ((m.pnl / startingCapital) * 100).toFixed(2),
    }))
    .sort((a, b) => a.year - b.year || a.month - b.month);
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">
        ${payload[0].value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}

function PerformanceCharts({ trades, simulationCapital }) {
  const startingCapital = simulationCapital || 100000;

  const equityCurve = useMemo(
    () => calculateEquityCurve(trades, startingCapital),
    [trades, startingCapital]
  );

  const monthlyReturns = useMemo(
    () => calculateMonthlyReturns(trades, startingCapital),
    [trades, startingCapital]
  );

  if (!trades || trades.length === 0) {
    return null;
  }

  // Group monthly returns by year for grid display
  const years = [...new Set(monthlyReturns.map((m) => m.year))];
  const returnsByYearMonth = {};
  monthlyReturns.forEach((m) => {
    returnsByYearMonth[`${m.year}-${m.month}`] = m.returnPct;
  });

  return (
    <div className="performance-charts">
      {/* Equity Curve */}
      {equityCurve.length > 0 && (
        <div className="equity-chart-section">
          <h3>Equity Curve</h3>
          <div className="equity-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Returns */}
      {monthlyReturns.length > 0 && (
        <div className="monthly-returns-section">
          <h3>Monthly Returns</h3>
          <div className="monthly-returns-grid-wrapper">
            <table className="monthly-returns-grid">
              <thead>
                <tr>
                  <th>Year</th>
                  {MONTHS.map((m) => (
                    <th key={m}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {years.map((year) => (
                  <tr key={year}>
                    <td className="monthly-returns-year">{year}</td>
                    {MONTHS.map((_, idx) => {
                      const val = returnsByYearMonth[`${year}-${idx}`];
                      const num = val ? parseFloat(val) : null;
                      const cls =
                        num === null
                          ? 'return-empty'
                          : num > 0
                          ? 'return-positive'
                          : num < 0
                          ? 'return-negative'
                          : 'return-zero';
                      return (
                        <td key={idx} className={cls}>
                          {num !== null ? `${num > 0 ? '+' : ''}${val}%` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceCharts;
