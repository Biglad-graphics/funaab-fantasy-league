import { getFormStatus, formatRating, getPriceTrend } from '../lib/ratingEngine'

/**
 * PlayerFormBadge Component
 * Displays player rating, form status, and price trend
 * Usage: <PlayerFormBadge player={player} />
 */
export default function PlayerFormBadge({ player, showPrice = true }) {
  if (!player) return null

  const form = getFormStatus(player.current_rating || 5.0)
  const priceInfo = getPriceTrend(player.price_change || 0)

  return (
    <div style={styles.container}>
      {/* Form Status Badge */}
      <div style={{ ...styles.badge, borderColor: form.color, background: `${form.color}15` }}>
        <span style={{ color: form.color, fontWeight: '700', fontSize: '.65rem', letterSpacing: '1px' }}>
          {form.label}
        </span>
      </div>

      {/* Rating Display */}
      <div style={styles.ratingBox}>
        <div style={styles.ratingLabel}>Rating</div>
        <div style={styles.ratingValue}>{formatRating(player.current_rating || 5.0)}</div>
        <div style={styles.ratingMax}>/10</div>
      </div>

      {/* Price Display */}
      {showPrice && (
        <div style={styles.priceBox}>
          <div style={styles.priceLabel}>Price</div>
          <div style={styles.priceValue}>₦{player.price?.toFixed(1) || 5.0}M</div>
          {player.price_change !== undefined && player.price_change !== 0 && (
            <div style={{ ...styles.priceTrend, color: priceInfo.color }}>
              {priceInfo.indicator}
            </div>
          )}
        </div>
      )}

      {/* Last Match Info */}
      {player.last_match_date && (
        <div style={styles.meta}>
          <span style={styles.metaLabel}>Last match:</span>
          <span style={styles.metaValue}>
            {new Date(player.last_match_date).toLocaleDateString('en-GB', { day: 'short', month: 'short' })}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * PlayerFormRow Component
 * Compact version for player lists
 */
export function PlayerFormRow({ player }) {
  if (!player) return null
  const form = getFormStatus(player.current_rating || 5.0)

  return (
    <div style={styles.row}>
      <div style={{ ...styles.formDot, background: form.color }} title={form.label} />
      <div style={styles.rowInfo}>
        <div style={styles.rowLabel}>{player.name}</div>
        <div style={styles.rowMeta}>
          {player.position} • Rating {formatRating(player.current_rating || 5.0)} • ₦{player.price?.toFixed(1) || 5.0}M
        </div>
      </div>
      <div style={{ ...styles.rowBadge, color: form.color }}>{form.label}</div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '.8rem',
    padding: '1rem',
    background: '#111A13',
    border: '1px solid #1E2E20',
    borderRadius: '8px',
    fontSize: '.8rem'
  },
  badge: {
    padding: '.4rem .6rem',
    borderRadius: '6px',
    border: '1.5px solid',
    textAlign: 'center'
  },
  ratingBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '.3rem',
    justifyContent: 'center'
  },
  ratingLabel: {
    fontSize: '.65rem',
    color: '#5A7A5E',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  ratingValue: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '1.8rem',
    color: '#E8F5E9',
    lineHeight: 1
  },
  ratingMax: {
    fontSize: '.75rem',
    color: '#5A7A5E'
  },
  priceBox: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '.4rem',
    justifyContent: 'center',
    position: 'relative'
  },
  priceLabel: {
    fontSize: '.65rem',
    color: '#5A7A5E',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  priceValue: {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '1.4rem',
    color: '#FFD700',
    lineHeight: 1
  },
  priceTrend: {
    fontSize: '1.2rem',
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)'
  },
  meta: {
    display: 'flex',
    gap: '.4rem',
    justifyContent: 'center',
    fontSize: '.7rem',
    paddingTop: '.4rem',
    borderTop: '1px solid #1E2E20'
  },
  metaLabel: {
    color: '#5A7A5E'
  },
  metaValue: {
    color: '#E8F5E9',
    fontWeight: '600'
  },

  // Row styles
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '.8rem',
    padding: '.8rem',
    background: '#111A13',
    border: '1px solid #1E2E20',
    borderRadius: '6px',
    marginBottom: '.6rem'
  },
  formDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0
  },
  rowInfo: {
    flex: 1,
    minWidth: 0
  },
  rowLabel: {
    fontWeight: '700',
    fontSize: '.82rem',
    color: '#E8F5E9',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  rowMeta: {
    fontSize: '.7rem',
    color: '#5A7A5E',
    marginTop: '.2rem'
  },
  rowBadge: {
    fontSize: '.65rem',
    fontWeight: '700',
    flexShrink: 0
  }
}
