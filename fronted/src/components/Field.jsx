export default function Field({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  step = 1,
  hint,
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-shell">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );
}
