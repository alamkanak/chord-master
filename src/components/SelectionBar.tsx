import Button from "./Button";
import DurationPicker from "./DurationPicker";

interface SelectionBarProps {
  /** Items currently selected, rendered as removable pills */
  selectedItems: { key: string; label: string }[];
  /** Called when user removes (clicks) a pill */
  onRemove: (key: string) => void;
  /** Placeholder text when nothing is selected */
  emptyText?: string;
  /** Drill duration in seconds */
  drillDuration: number;
  /** Called when duration changes */
  onDurationChange: (seconds: number) => void;
  /** Duration picker options */
  durationOptions?: number[];
  /** Minimum required selections to enable Start Drill */
  minSelections?: number;
  /** Called when Start Drill is clicked */
  onStartDrill: () => void;
  /** Called when Clear is clicked */
  onClear: () => void;
  /** Extra action buttons (e.g. Random for chords) rendered between Clear and Start */
  extraActions?: React.ReactNode;
}

export default function SelectionBar({
  selectedItems,
  onRemove,
  emptyText = "Select items to get started",
  drillDuration,
  onDurationChange,
  durationOptions,
  minSelections = 1,
  onStartDrill,
  onClear,
  extraActions,
}: SelectionBarProps) {
  const canStart = selectedItems.length >= minSelections;

  return (
    <div className="sticky top-14 sm:top-16 z-30 border-b border-slate-200/50 bg-white/40 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col gap-3">
          {/* Row 1: Selected items */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedItems.length === 0 ? (
              <span className="text-slate-400 font-medium py-1.5 text-sm">
                {emptyText}
              </span>
            ) : (
              <>
                {selectedItems.map((item) => (
                  <Button
                    key={item.key}
                    onClick={() => onRemove(item.key)}
                    variant="pill"
                    size="sm"
                    selected
                  >
                    {item.label}
                    <span className="text-base leading-none hover:text-blue-900">
                      ×
                    </span>
                  </Button>
                ))}
                <Button
                  onClick={onClear}
                  variant="ghost"
                  size="sm"
                  className="ml-1"
                >
                  Clear all
                </Button>
              </>
            )}
          </div>

          {/* Row 2: Duration + Actions — semantically grouped */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DurationPicker
              value={drillDuration}
              onChange={onDurationChange}
              options={durationOptions}
            />

            <div className="flex gap-2">
              {extraActions}
              <Button
                onClick={onStartDrill}
                disabled={!canStart}
                variant="primary"
                size="sm"
                className="flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Drill
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
