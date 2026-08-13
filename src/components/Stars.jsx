// 별점 컴포넌트. readonly면 표시만, 아니면 클릭으로 설정.
export default function Stars({ value = 0, onChange, readonly = false }) {
  return (
    <span className={'stars' + (readonly ? ' readonly' : '')}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= value ? 'on' : ''}
          disabled={readonly}
          onClick={() => onChange && onChange(n === value ? 0 : n)}
          aria-label={`${n}점`}
        >
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </span>
  )
}
