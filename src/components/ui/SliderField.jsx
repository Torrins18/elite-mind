export function SliderField({
  label,
  hint,
  value,
  onChange,
  lowLabel,
  highLabel,
  min = 1,
  max = 10,
}) {
  return (
    <label className="slider-field">
      <div className="slider-field__row">
        <span className="slider-field__label">{label}</span>
        <span className="slider-field__value">
          {value}/{max}
        </span>
      </div>
      {hint && <p className="slider-field__hint">{hint}</p>}
      <input
        type="range"
        min={min}
        max={max}
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
