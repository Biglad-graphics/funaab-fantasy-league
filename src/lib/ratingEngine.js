/**
 * Player Rating & Dynamic Price System
 * Campus League Edition
 */

/**
 * Calculate player rating from match points
 * Formula: Rating = (Points / 20) * 10
 * Max realistic points = 20, rating cap = 10
 */
export const calculatePlayerRating = (points) => {
  const rating = (points / 20) * 10;
  return Math.min(rating, 10); // Cap at 10
};

/**
 * Get player form status based on rating
 */
export const getFormStatus = (rating) => {
  if (rating >= 7) return { status: 'in-form', label: '🟢 In Form', color: '#00E676' };
  if (rating >= 4) return { status: 'average', label: '🟡 Average', color: '#FFD700' };
  return { status: 'out-of-form', label: '🔴 Out of Form', color: '#EF9A9A' };
};

/**
 * Calculate player's rolling average rating (last 3 matches)
 */
export const calculateRatingTrend = (matchRatings) => {
  if (!matchRatings || matchRatings.length === 0) return null;
  
  const last3 = matchRatings.slice(-3);
  const avg = last3.reduce((sum, r) => sum + r.rating, 0) / last3.length;
  
  return {
    currentAvg: avg,
    trend: matchRatings.length < 2 ? 'new' : last3[last3.length - 1].rating - matchRatings[matchRatings.length - 2].rating,
    matches: matchRatings.length
  };
};

/**
 * Calculate price adjustment based on rating trend
 * Only adjust if trend has changed (±5% per rating point)
 */
export const calculatePriceAdjustment = (previousRating, currentRating, currentPrice) => {
  const ratingChange = currentRating - previousRating;
  
  // Only adjust if trend changed (more than 0.1 point change)
  if (Math.abs(ratingChange) < 0.1) {
    return {
      newPrice: currentPrice,
      change: 0,
      percent: 0,
      adjusted: false
    };
  }
  
  // 5% per rating point
  const percentChange = ratingChange * 5; // ±5% per rating point
  const priceChange = currentPrice * (percentChange / 100);
  const newPrice = parseFloat((currentPrice + priceChange).toFixed(2));
  
  // Price bounds (min ₦1.0M, max ₦15.0M)
  const boundedPrice = Math.max(1.0, Math.min(15.0, newPrice));
  
  return {
    newPrice: boundedPrice,
    change: boundedPrice - currentPrice,
    percent: percentChange.toFixed(1),
    adjusted: true
  };
};

/**
 * Format rating for display
 */
export const formatRating = (rating) => {
  return rating ? rating.toFixed(1) : '—';
};

/**
 * Format price with currency
 */
export const formatPrice = (price) => {
  return `₦${price.toFixed(1)}M`;
};

/**
 * Get price trend indicator
 */
export const getPriceTrend = (priceChange) => {
  if (priceChange > 0) return { indicator: '📈', color: '#00E676', text: `+₦${priceChange.toFixed(2)}M` };
  if (priceChange < 0) return { indicator: '📉', color: '#EF9A9A', text: `−₦${Math.abs(priceChange).toFixed(2)}M` };
  return { indicator: '→', color: '#5A7A5E', text: 'Stable' };
};

/**
 * Prepare match rating record for database
 */
export const createMatchRatingRecord = (playerId, matchId, points, previousAvgRating, priceAdjustment) => {
  const newRating = calculatePlayerRating(points);
  
  return {
    player_id: playerId,
    match_id: matchId,
    points_earned: points,
    rating: parseFloat(newRating.toFixed(2)),
    previous_avg_rating: previousAvgRating || 5.0,
    rating_change: parseFloat((newRating - (previousAvgRating || 5.0)).toFixed(2)),
    price_before: priceAdjustment.previousPrice,
    price_after: priceAdjustment.newPrice,
    price_change_percent: parseFloat(priceAdjustment.percent),
    price_adjusted: priceAdjustment.adjusted,
    created_at: new Date().toISOString()
  };
};
