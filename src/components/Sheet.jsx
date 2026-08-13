import { useEffect } from 'react'

// 하단에서 올라오는 시트형 모달.
export default function Sheet({ title, onClose, children, headExtra }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {headExtra}
            <button className="btn ghost" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
