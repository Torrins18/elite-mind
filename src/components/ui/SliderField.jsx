export function SliderField({ label, value, onChange, lowLabel, highLabel }) {
  return (
    <label className="slider-field">
      <div className="slider-field__row">
        <span>{label}</span>
        <span className="slider-field__value">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="slider-field__labels">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </label>
  )
}
