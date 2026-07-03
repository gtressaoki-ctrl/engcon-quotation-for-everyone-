'use client';

// 数量入力の共通ステッパー（− 値 ＋）。指でタップして増減、数値部は直接入力も可。
export default function Stepper({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="減らす"
        className="w-11 h-11 flex items-center justify-center text-xl text-gray-600 hover:bg-gray-100 disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || min))}
        className="w-12 h-11 text-center border-x border-gray-300 focus:outline-none tabular-nums"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="増やす"
        className="w-11 h-11 flex items-center justify-center text-xl text-gray-600 hover:bg-gray-100"
      >
        ＋
      </button>
    </div>
  );
}
