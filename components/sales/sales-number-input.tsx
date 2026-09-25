'use client';

import React, { useState, useEffect } from 'react';

interface SalesNumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  allowDecimals?: boolean;
}

export const SalesNumberInput: React.FC<SalesNumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  className = '',
  placeholder = '0',
  disabled = false,
  allowDecimals = true,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(
    value === undefined || value === null
      ? ''
      : String(value)
  );

  useEffect(() => {
    // Keep displayValue in sync with value prop when value changes externally,
    // unless user is actively editing (e.g. empty string or single dash)
    if (displayValue === '' || displayValue === '-') return;
    const num = parseFloat(displayValue);
    if (isNaN(num) || num !== value) {
      setDisplayValue(value === undefined || value === null ? '' : String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);

    if (raw === '' || raw === '-') {
      return;
    }

    let parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
    if (isNaN(parsed)) {
      return;
    }

    if (max !== undefined && parsed > max) {
      parsed = max;
      setDisplayValue(String(parsed));
    }

    onChange(parsed);
  };

  const handleBlur = () => {
    if (displayValue === '' || displayValue === '-' || isNaN(parseFloat(displayValue))) {
      const fallback = min !== undefined ? min : 0;
      setDisplayValue(String(fallback));
      onChange(fallback);
    } else {
      let parsed = allowDecimals ? parseFloat(displayValue) : parseInt(displayValue, 10);
      if (min !== undefined && parsed < min) parsed = min;
      if (max !== undefined && parsed > max) parsed = max;
      setDisplayValue(String(parsed));
      onChange(parsed);
    }
  };

  return (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
};

export default SalesNumberInput;
