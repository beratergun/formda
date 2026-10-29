import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Legend,
  ReferenceArea,
} from 'recharts';
import { EmptyState } from './index';

export interface ChartPoint {
  label: string;
  [key: string]: number | string | null | undefined | [number, number];
}
export function Chart({
  data,
  series,
  label,
  goal,
  bar = false,
  band,
  rangeKey,
  milestones = [],
}: {
  data: ChartPoint[];
  series: { key: string; name: string; color?: string }[];
  label: string;
  goal?: number;
  bar?: boolean;
  band?: [number, number];
  rangeKey?: string;
  milestones?: number[];
}) {
  const colors = ['var(--accent)', 'var(--strength)', 'var(--swim)', 'var(--cardio)'];
  if (!data.length || !data.some((point) => series.some((s) => typeof point[s.key] === 'number')))
    return (
      <EmptyState title="İlk kayıtlarınla şekillenecek">
        Kaydettikçe kendi ritmini burada görebileceksin.
      </EmptyState>
    );
  const children = [
    <CartesianGrid key="grid" stroke="var(--line)" vertical={false} />,
    <XAxis
      key="x"
      dataKey="label"
      tick={{ fill: 'var(--sub)', fontSize: 9 }}
      minTickGap={25}
      axisLine={false}
      tickLine={false}
    />,
    <YAxis
      key="y"
      width={36}
      tick={{ fill: 'var(--sub)', fontSize: 9 }}
      axisLine={false}
      tickLine={false}
      domain={['auto', 'auto']}
    />,
    <Tooltip
      key="tooltip"
      formatter={(value: unknown) =>
        Array.isArray(value)
          ? value.map((n) => Number(n).toLocaleString('tr', { maximumFractionDigits: 1 })).join('–')
          : typeof value === 'number'
            ? value.toLocaleString('tr', { maximumFractionDigits: 1 })
            : String(value ?? '')
      }
      contentStyle={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        color: 'var(--ink)',
        fontSize: 11,
      }}
    />,
    <Legend key="legend" wrapperStyle={{ fontSize: 10 }} />,
  ];
  return (
    <div className="chart-container" role="figure" aria-label={label}>
      <ResponsiveContainer width="100%" height={235} minWidth={0}>
        {bar ? (
          <BarChart
            data={data}
            accessibilityLayer
            margin={{ top: 12, right: 5, bottom: 0, left: -8 }}
          >
            {children}
            {series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color || colors[i % colors.length]}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        ) : (
          <ComposedChart
            data={data}
            accessibilityLayer
            margin={{ top: 12, right: 5, bottom: 0, left: -8 }}
          >
            {children}
            {rangeKey && (
              <Area
                dataKey={rangeKey}
                name="0,5–1 kg/hafta örnek bandı"
                fill="var(--accent)"
                fillOpacity={0.12}
                stroke="none"
                isAnimationActive={false}
              />
            )}
            {band && (
              <ReferenceArea y1={band[0]} y2={band[1]} fill="var(--accent)" fillOpacity={0.08} />
            )}
            {goal !== undefined && (
              <ReferenceLine y={goal} stroke="var(--sub)" strokeDasharray="4 4" />
            )}
            {milestones.map((value) => (
              <ReferenceLine
                key={value}
                y={value}
                stroke="var(--line)"
                strokeDasharray="2 5"
                label={{
                  value: `${value} kg`,
                  fill: 'var(--sub)',
                  fontSize: 9,
                  position: 'insideTopRight',
                }}
              />
            ))}
            {series.map((s, i) => (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.name}
                stroke={s.color || colors[i % colors.length]}
                strokeWidth={2}
                dot={data.length < 20}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
