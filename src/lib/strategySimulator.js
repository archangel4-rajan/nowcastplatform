// Strategy Simulator — checks rules and auto-executes trades

const BTC_SELL_THRESHOLD = 65000;
const BTC_BUY_THRESHOLD = 67000;

export async function checkAndExecuteTrade(strategy, currentPrice, supabase) {
  if (!strategy || !currentPrice || !supabase) return null;
  if (strategy.strategy_type !== 'automated') return null;

  const position = strategy.current_position;
  const capital = Number(strategy.simulation_capital) || 100000;

  // Determine if we should trade based on BTC Momentum Shield rules
  let shouldSell = false;
  let shouldBuy = false;

  if (position === 'holding' && currentPrice < BTC_SELL_THRESHOLD) {
    shouldSell = true;
  } else if (position === 'cash' && currentPrice > BTC_BUY_THRESHOLD) {
    shouldBuy = true;
  } else {
    // Update last_price_check timestamp
    await supabase
      .from('nc_strategies')
      .update({ last_price_check: new Date().toISOString() })
      .eq('id', strategy.id);
    return null;
  }

  // Check last trade to prevent duplicates
  try {
    const { data: lastTrades } = await supabase
      .from('nc_trades')
      .select('direction')
      .eq('strategy_id', strategy.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastDirection = lastTrades?.[0]?.direction;
    if (shouldSell && lastDirection === 'sell') return null;
    if (shouldBuy && lastDirection === 'buy') return null;
  } catch {
    // If trades table doesn't exist, proceed
  }

  const direction = shouldSell ? 'sell' : 'buy';
  const quantity = shouldSell
    ? capital / (strategy.position_entry_price || currentPrice)
    : capital / currentPrice;

  // Calculate new capital for sell
  let newCapital = capital;
  if (shouldSell && strategy.position_entry_price) {
    const pnlPct = (currentPrice - strategy.position_entry_price) / strategy.position_entry_price;
    newCapital = capital * (1 + pnlPct);
  }

  const trade = {
    strategy_id: strategy.id,
    direction,
    ticker: 'BTC',
    market_type: 'crypto',
    quantity: parseFloat(quantity.toFixed(6)),
    price: currentPrice,
    rationale: shouldSell
      ? `Auto-sell: BTC dropped below $${BTC_SELL_THRESHOLD.toLocaleString()}`
      : `Auto-buy: BTC rose above $${BTC_BUY_THRESHOLD.toLocaleString()}`,
    conviction: 4,
  };

  try {
    const { data: insertedTrade, error: tradeError } = await supabase
      .from('nc_trades')
      .insert(trade)
      .select()
      .single();

    if (tradeError) return null;

    // Update strategy state
    const strategyUpdate = {
      current_position: shouldSell ? 'cash' : 'holding',
      position_entry_price: shouldBuy ? currentPrice : null,
      last_price_check: new Date().toISOString(),
      simulation_capital: shouldSell ? parseFloat(newCapital.toFixed(2)) : capital,
    };

    await supabase
      .from('nc_strategies')
      .update(strategyUpdate)
      .eq('id', strategy.id);

    return { executed: true, trade: insertedTrade, newCapital: strategyUpdate.simulation_capital };
  } catch {
    return null;
  }
}
