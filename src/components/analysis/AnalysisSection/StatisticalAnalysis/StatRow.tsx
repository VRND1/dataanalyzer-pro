interface StatRowProps {
  label: string;
  value: string;
}

export function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-black-600">{label}</span>
      <span className="font-medium text-black">{value}</span>
    </div>
  );
}