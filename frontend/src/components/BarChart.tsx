'use client'
interface BarChartProps {
  data: any[]
  xKey: string
  yKey: string
  title: string
}

export default function BarChart({ data, xKey, yKey, title }: BarChartProps) {
  if (!data.length) return <div className="p-4">No data</div>
  
  const maxValue = Math.max(...data.map(d => d[yKey] || 0))
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.slice(0, 10).map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium truncate">{item[xKey]}</span>
              <span className="text-gray-600">{item[yKey]?.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-6">
              <div 
                className="bg-blue-500 h-6 rounded transition-all"
                style={{ width: `${(item[yKey] / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}