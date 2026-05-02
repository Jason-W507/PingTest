import { useState, type FormEvent } from 'react';
import { isValidTarget } from '@pingtest/shared';

interface Props {
  onStart: (target: string, count: number) => void;
  loading: boolean;
}

export default function TargetInput({ onStart, loading }: Props) {
  const [value, setValue] = useState('');
  const [count, setCount] = useState(4);

  const valid = isValidTarget(value);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    onStart(value.trim(), count);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[240px]">
        <label className="block text-xs text-gray-400 mb-1">IP Address or Domain</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 8.8.8.8 or google.com"
          className="input-field"
          disabled={loading}
          autoFocus
        />
      </div>
      <div className="w-28">
        <label className="block text-xs text-gray-400 mb-1">Packets</label>
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="input-field"
          disabled={loading}
        >
          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
            <option key={n} value={n} className="bg-gray-800">{n}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={!valid || loading}
        className="btn-primary h-10"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Testing...
          </span>
        ) : (
          'Start Test'
        )}
      </button>
    </form>
  );
}
