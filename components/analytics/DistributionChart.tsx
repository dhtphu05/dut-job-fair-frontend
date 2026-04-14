'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

interface DistributionChartProps {
  data: Array<{ name: string; value: number }>
  title: string
}

const COLORS = ['#3B82F6', '#06B6D4', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981']

export function DistributionChart({ data, title }: DistributionChartProps) {
  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              formatter={(value) => `${value} visitors`} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
