import './PortfolioCard.css'

const COLORS = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

const ASSET_META = {
  STOCK: { label: '주식', className: 'chip-stock' },
  CRYPTO: { label: '코인', className: 'chip-crypto' },
  MIXED: { label: '혼합', className: 'chip-mixed' },
  EMPTY: { label: '미구성', className: 'chip-empty' },
}

export const getAssetType = (portfolio) => {
  const holdings = portfolio.holdings || []
  if (holdings.length === 0) return 'EMPTY'
  const hasCrypto = holdings.some((h) => h.symbol?.is_crypto)
  const hasStock = holdings.some((h) => !h.symbol?.is_crypto)
  if (hasCrypto && hasStock) return 'MIXED'
  return hasCrypto ? 'CRYPTO' : 'STOCK'
}

const MiniWeightBar = ({ holdings = [] }) => {
  const sorted = [...holdings].sort(
    (a, b) => parseFloat(b.target_weight_percent || 0) - parseFloat(a.target_weight_percent || 0)
  )
  const weightSum = sorted.reduce((sum, h) => sum + parseFloat(h.target_weight_percent || 0), 0)
  const cash = Math.max(0, 100 - weightSum)

  if (sorted.length === 0) {
    return (
      <div className="mini-weight-bar empty">
        <span>등록된 종목이 없습니다.</span>
      </div>
    )
  }

  const top = sorted.slice(0, 4)
  const restCount = sorted.length - top.length

  return (
    <div className="mini-weight-wrap">
      <div className="mini-weight-bar">
        {sorted.map((h, i) => (
          <span
            key={h.id ?? i}
            className="mini-weight-segment"
            style={{ width: `${parseFloat(h.target_weight_percent || 0)}%`, backgroundColor: COLORS[i % COLORS.length] }}
            title={`${h.symbol?.ticker || '-'}: ${parseFloat(h.target_weight_percent || 0).toFixed(1)}%`}
          />
        ))}
        {cash > 0.01 && (
          <span className="mini-weight-segment cash" style={{ width: `${cash}%` }} title={`현금: ${cash.toFixed(1)}%`} />
        )}
      </div>
      <div className="mini-weight-legend">
        {top.map((h, i) => (
          <span key={h.id ?? i} className="mini-weight-tag">
            <i style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {h.symbol?.ticker || '-'} {parseFloat(h.target_weight_percent || 0).toFixed(0)}%
          </span>
        ))}
        {restCount > 0 && <span className="mini-weight-tag more">+{restCount}개</span>}
      </div>
    </div>
  )
}

const PortfolioCard = ({
  portfolio,
  isMine,
  isSubscribed,
  canManage,
  isSelected,
  onSelect,
  onEdit,
  onEditWeights,
  onDelete,
  onSubscribe,
}) => {
  const assetMeta = ASSET_META[getAssetType(portfolio)]

  return (
    <div className={`portfolio-card${isSelected ? ' is-selected' : ''}`}>
      <div className="portfolio-card-badges">
        <span className={`chip ${assetMeta.className}`}>{assetMeta.label}</span>
        {isMine && <span className="chip chip-mine">내 포트폴리오</span>}
        {isSubscribed && <span className="chip chip-subscribed">구독 중</span>}
        <span className={`chip chip-visibility ${portfolio.visibility === 'PUBLIC' ? 'is-public' : 'is-private'}`}>
          {portfolio.visibility === 'PUBLIC' ? '공개' : '비공개'}
        </span>
        <span
          className={`status-dot ${portfolio.enabled ? 'on' : 'off'}`}
          title={portfolio.enabled ? '활성' : '비활성'}
        />
      </div>

      <button type="button" className="portfolio-card-title" onClick={() => onSelect(portfolio)}>
        {portfolio.title}
      </button>
      {portfolio.description && <p className="portfolio-card-desc">{portfolio.description}</p>}

      <MiniWeightBar holdings={portfolio.holdings} />

      <div className="portfolio-card-meta">
        <span>{portfolio.holdings?.length ?? 0}개 종목</span>
        <span>{portfolio.owner_username || '알 수 없음'}</span>
      </div>

      <div className="portfolio-card-actions">
        {canManage ? (
          <>
            <button type="button" className="card-btn" onClick={() => onEdit(portfolio)}>수정</button>
            <button type="button" className="card-btn" onClick={() => onEditWeights(portfolio)}>비중 편집</button>
            <button type="button" className="card-btn danger" onClick={() => onDelete(portfolio)}>삭제</button>
          </>
        ) : (
          <>
            <button type="button" className="card-btn" onClick={() => onSelect(portfolio)}>상세보기</button>
            {!isSubscribed && (
              <button type="button" className="card-btn primary" onClick={() => onSubscribe(portfolio)}>구독하기</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PortfolioCard
