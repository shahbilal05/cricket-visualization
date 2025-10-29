interface StatsTableProps {
  data: any[]
  columns: { key: string; label: string }[]
}

export default function StatsTable({ data, columns }: StatsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            {columns.map(col => (
              <th key={col.key} className="p-4 text-left text-sm font-semibold">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t hover:bg-gray-50">
              {columns.map(col => (
                <td key={col.key} className="p-4 text-sm">
                  {typeof row[col.key] === 'number' 
                    ? row[col.key].toLocaleString() 
                    : row[col.key] || 'N/A'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}