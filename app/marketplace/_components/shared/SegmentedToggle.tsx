'use client'

import { useState } from 'react'
import { MaterialSymbol } from './MaterialSymbol'

type SegmentedOption = {
  value: string
  label: string
  icon: string
}

export function SegmentedToggle({
  options,
  value: controlledValue,
  onChange,
  defaultValue,
  variant = 'light',
}: {
  options: SegmentedOption[]
  value?: string
  onChange?: (value: string) => void
  defaultValue?: string
  variant?: 'light' | 'dark'
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value)
  const value = controlledValue ?? internalValue
  const handleChange = (next: string) => {
    onChange?.(next)
    if (controlledValue === undefined) setInternalValue(next)
  }
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const isDark = variant === 'dark'

  return (
    <div
      className={`inline-flex rounded-full p-1 ${isDark ? 'bg-white/10 backdrop-blur-sm' : 'bg-[var(--ms-surface-container)]'}`}
    >
      <div
        className="relative grid"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        <div
          className={`absolute top-0 bottom-0 left-0 rounded-full transition-transform duration-300 ease-out ${
            isDark ? 'bg-white shadow-lg' : 'bg-[var(--ms-primary)] shadow-[var(--ms-shadow-card-hover)]'
          }`}
          style={{
            width: `${100 / options.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange(option.value)}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors duration-300 ${
                active
                  ? isDark
                    ? 'text-[var(--ms-primary)]'
                    : 'text-white'
                  : isDark
                    ? 'text-white/70 hover:text-white'
                    : 'text-[var(--ms-on-surface-variant)] hover:text-[var(--ms-primary)]'
              }`}
            >
              <MaterialSymbol name={option.icon} className="!text-lg" />
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
