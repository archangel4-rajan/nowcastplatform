import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function Wallet() {
  const { user, wallet, refreshWallet } = useAuth();
  const [deployments, setDeployments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user || !wallet) {
      setLoading(false);
      return;
    }

    try {
      const [depRes, txRes] = await Promise.all([
        supabase
          .from('nc_deployments')
          .select('*, nc_strategies(title)')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('nc_wallet_transactions')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setDeployments(depRes.data || []);
      setTransactions(txRes.data || []);
    } catch {
      // Tables may not exist yet
    }
    setLoading(false);
  }, [user, wallet]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDeposit(e) {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0 || !wallet) return;

    setActionLoading(true);
    try {
      await supabase
        .from('nc_wallets')
        .update({ balance: wallet.balance + amount })
        .eq('id', wallet.id);

      await supabase
        .from('nc_wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'deposit',
          amount: amount,
          description: `Deposited $${amount.toFixed(2)}`,
        });

      await refreshWallet();
      await fetchData();
      setDepositAmount('');
      setShowDeposit(false);
      setNotification({ type: 'success', message: `Deposited $${amount.toFixed(2)} successfully` });
    } catch {
      setNotification({ type: 'error', message: 'Deposit failed' });
    }
    setActionLoading(false);
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || !wallet) return;
    if (amount > wallet.balance) {
      setNotification({ type: 'error', message: 'Insufficient balance' });
      return;
    }

    setActionLoading(true);
    try {
      await supabase
        .from('nc_wallets')
        .update({ balance: wallet.balance - amount })
        .eq('id', wallet.id);

      await supabase
        .from('nc_wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'withdrawal',
          amount: -amount,
          description: `Withdrew $${amount.toFixed(2)}`,
        });

      await refreshWallet();
      await fetchData();
      setWithdrawAmount('');
      setShowWithdraw(false);
      setNotification({ type: 'success', message: `Withdrew $${amount.toFixed(2)} successfully` });
    } catch {
      setNotification({ type: 'error', message: 'Withdrawal failed' });
    }
    setActionLoading(false);
  }

  async function handleWithdrawDeployment(deploymentId) {
    setActionLoading(true);
    try {
      const { data } = await supabase.rpc('nc_withdraw_capital', {
        p_user_id: user.id,
        p_deployment_id: deploymentId,
      });

      if (data?.error) {
        setNotification({ type: 'error', message: data.error });
      } else {
        setNotification({ type: 'success', message: `Capital withdrawn: $${data.returned?.toFixed(2)}` });
        await refreshWallet();
        await fetchData();
      }
    } catch {
      setNotification({ type: 'error', message: 'Withdrawal failed' });
    }
    setActionLoading(false);
  }

  const txTypeBadgeClass = (type) => {
    const map = {
      deposit: 'tx-type-deposit',
      withdrawal: 'tx-type-withdrawal',
      deploy: 'tx-type-deploy',
      return: 'tx-type-return',
      earning: 'tx-type-earning',
      fee: 'tx-type-fee',
    };
    return map[type] || '';
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading wallet...</div></div>;
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Wallet</h1>
            <p className="subtitle">Manage your capital</p>
          </div>
        </div>

        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Balance</h3>
            <div className="wallet-balance">
              ${wallet ? Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <div className="wallet-actions">
              <button className="btn btn-primary btn-sm" onClick={() => { setShowDeposit(!showDeposit); setShowWithdraw(false); }}>
                Deposit Money
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowWithdraw(!showWithdraw); setShowDeposit(false); }}>
                Withdraw
              </button>
            </div>

            {showDeposit && (
              <form onSubmit={handleDeposit} className="deploy-form">
                <div className="form-group">
                  <label>Deposit Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <button className="btn btn-primary btn-sm" disabled={actionLoading} type="submit">
                  {actionLoading ? 'Processing...' : 'Confirm Deposit'}
                </button>
              </form>
            )}

            {showWithdraw && (
              <form onSubmit={handleWithdraw} className="deploy-form">
                <div className="form-group">
                  <label>Withdraw Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    max={wallet?.balance || 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <button className="btn btn-secondary btn-sm" disabled={actionLoading} type="submit">
                  {actionLoading ? 'Processing...' : 'Confirm Withdraw'}
                </button>
              </form>
            )}
          </div>

          <div className="dashboard-card">
            <h3>Deployments Summary</h3>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-value">{deployments.length}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  ${deployments.reduce((sum, d) => sum + Number(d.current_value), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="stat-label">Total Deployed</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card full-width">
            <h3>Active Deployments</h3>
            {deployments.length === 0 ? (
              <p className="empty-state">
                No active deployments. <Link to="/marketplace">Browse strategies</Link> to deploy capital.
              </p>
            ) : (
              <div className="subscription-list">
                {deployments.map(dep => {
                  const gainLoss = Number(dep.current_value) - Number(dep.amount);
                  const gainLossPct = ((gainLoss / Number(dep.amount)) * 100).toFixed(2);
                  const isGain = gainLoss >= 0;
                  return (
                    <div key={dep.id} className="deployment-card">
                      <div className="subscription-info">
                        <Link to={`/strategy/${dep.strategy_id}`} className="subscription-title">
                          {dep.nc_strategies?.title || 'Strategy'}
                        </Link>
                        <div className="deployment-details">
                          <span>Deployed: ${Number(dep.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          <span>Current: ${Number(dep.current_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          <span className={isGain ? 'deployment-gain' : 'deployment-loss'}>
                            {isGain ? '+' : ''}{gainLossPct}%
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleWithdrawDeployment(dep.id)}
                        disabled={actionLoading}
                      >
                        Withdraw
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="dashboard-card full-width">
            <h3>Transaction History</h3>
            {transactions.length === 0 ? (
              <p className="empty-state">No transactions yet.</p>
            ) : (
              <div className="tx-list">
                {transactions.map(tx => (
                  <div key={tx.id} className="tx-item">
                    <div className="tx-info">
                      <span className={`tx-type-badge ${txTypeBadgeClass(tx.type)}`}>
                        {tx.type}
                      </span>
                      <span className="tx-description">{tx.description}</span>
                    </div>
                    <div className="tx-meta">
                      <span className={Number(tx.amount) >= 0 ? 'deployment-gain' : 'deployment-loss'}>
                        {Number(tx.amount) >= 0 ? '+' : ''}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="tx-date">{new Date(tx.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wallet;
