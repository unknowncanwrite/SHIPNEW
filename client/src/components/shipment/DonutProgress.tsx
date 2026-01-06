import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface DonutProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  missedCount?: number;
}

export default function DonutProgress({ percentage, size = 160, strokeWidth = 15, missedCount = 0 }: DonutProgressProps) {
  // Calculate skipped percentage based on missed count
  // Assume roughly 10% per missed task for visualization (can be adjusted)
  const skippedPercentage = Math.min(missedCount * 5, 30);
  const completedPercentage = percentage;
  const remainingPercentage = Math.max(0, 100 - completedPercentage - skippedPercentage);

  const data = [
    { name: 'Completed', value: completedPercentage },
    { name: 'Skipped', value: skippedPercentage },
    { name: 'Remaining', value: remainingPercentage },
  ];

  const COLORS = ['hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--muted))'];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size / 2 - strokeWidth}
            outerRadius={size / 2}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-primary">{percentage}%</span>
        <span className="text-xs text-muted-foreground uppercase font-medium mt-1">Complete</span>
        {missedCount > 0 && (
          <span className="text-xs text-warning font-medium mt-2">⚠ {missedCount} Skipped</span>
        )}
      </div>
    </div>
  );
}
