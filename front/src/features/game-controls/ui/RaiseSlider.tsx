import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import './RaiseSlider.css';

interface RaiseSliderProps {
  min: number;
  max: number;
  onCancel: () => void;
  onConfirm: (amount: number) => void;
}

export default function RaiseSlider({ min, max, onCancel, onConfirm }: RaiseSliderProps) {
  const [value, setValue] = useState(min);

  useEffect(() => {
    if (min > max) setValue(max);
    else setValue(min);
  }, [min, max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value));
  };

  return (
    <div className="raise-slider-container">
      <div className="raise-info">
        <span className="raise-label">RAISE TO:</span>
        <span className="raise-value">{value}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={50}
        value={value}
        onChange={handleChange}
        className="raise-range"
      />

      <div className="raise-actions">
        <button className="raise-btn cancel" onClick={onCancel}><X /></button>
        <button className="raise-btn all-in" onClick={() => setValue(max)}>ALL-IN</button>
        <button className="raise-btn confirm" onClick={() => onConfirm(value)}><Check /></button>
      </div>
    </div>
  );
}