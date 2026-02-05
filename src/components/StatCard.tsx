interface StatCardProps {
  value: string | number;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-blue-600">{value}</div>
      <p className="text-sm text-slate-600 mt-1">{label}</p>
    </div>
  );
}
