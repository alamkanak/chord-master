import Button from "./Button";

interface DurationPickerProps {
  value: number;
  onChange: (seconds: number) => void;
  options?: number[];
}

const DEFAULT_OPTIONS = [60, 120, 180, 300];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} min`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function DurationPicker({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}: DurationPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-500 mr-1">Duration:</span>
      <div className="flex gap-1.5">
        {options.map((t) => (
          <Button
            key={t}
            onClick={() => onChange(t)}
            variant="duration"
            size="sm"
            selected={value === t}
          >
            {formatTime(t)}
          </Button>
        ))}
      </div>
    </div>
  );
}
