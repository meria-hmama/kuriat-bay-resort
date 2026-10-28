import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useThemeStore } from '../store/themeStore'

const COLORS = ['#1c7e75', '#e0a43a', '#3b82c4', '#a463c8', '#d1605a']

const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' })
}

function ChartCard({ title, desc, children }) {
  return (
    <figure className="card p-4">
      <figcaption>
        <h3 className="text-lg text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">{desc}</p>
      </figcaption>
      <div className="mt-3 h-64">{children}</div>
    </figure>
  )
}

export default function AdminCharts({ data }) {
  const dark = useThemeStore((s) => s.theme === 'dark')
  const axis = { stroke: dark ? '#94a3b8' : '#475569', fontSize: 12 }
  const grid = dark ? '#1e293b' : '#e2e8f0'
  const tooltip = {
    contentStyle: { background: dark ? '#0f172a' : '#fff', border: `1px solid ${grid}`, borderRadius: 12, fontSize: 13 },
    labelStyle: { color: dark ? '#e2e8f0' : '#0f172a' },
  }
  const monthly = data.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Occupancy rate" desc="Booked room-nights ÷ available room-nights, per month">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthly} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="occ" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#279d90" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#279d90" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="label" tick={axis} stroke={axis.stroke} />
            <YAxis unit="%" domain={[0, 100]} tick={axis} stroke={axis.stroke} />
            <Tooltip {...tooltip} formatter={(v) => [`${v}%`, 'Occupancy']} />
            <Area type="monotone" dataKey="occupancy" stroke="#1c7e75" strokeWidth={2} fill="url(#occ)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Monthly revenue" desc="Total paid by guests, counted on the check-in month (TND)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis dataKey="label" tick={axis} stroke={axis.stroke} />
            <YAxis tick={axis} stroke={axis.stroke} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
            <Tooltip {...tooltip} formatter={(v) => [`${v.toLocaleString()} TND`, 'Revenue']} cursor={{ fill: dark ? '#1e293b' : '#f1f5f9' }} />
            <Bar dataKey="revenue" fill="#e0a43a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Bookings by room type" desc="Number of bookings in the selected period">
        {data.byType.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-600 dark:text-slate-400">No bookings in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.byType} dataKey="count" nameKey="type" innerRadius="45%" outerRadius="80%" paddingAngle={2}>
                {data.byType.map((entry, i) => <Cell key={entry.type} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltip} formatter={(v, name) => [`${v} bookings`, name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* same numbers as a table, for screen readers and for people who prefer tables */}
      <ChartCard title="Monthly numbers" desc="The data behind the charts">
        <div className="h-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white text-left dark:bg-slate-900">
              <tr><th className="py-1.5">Month</th><th className="py-1.5 text-right">Occupancy</th><th className="py-1.5 text-right">Revenue</th></tr>
            </thead>
            <tbody>
              {monthly.map((m) => (
                <tr key={m.month} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1.5">{m.label}</td>
                  <td className="py-1.5 text-right">{m.occupancy}%</td>
                  <td className="py-1.5 text-right">{m.revenue.toLocaleString()} TND</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
