'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import BarChart from '@/components/BarChart'
import StatsTable from '@/components/StatsTable'

export default function BatterStatsPage() {
  const [data, setData] = useState<any[]>([])
  const [minRuns, setMinRuns] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)


  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (minRuns === null) return // skip fetch until client mounts
    async function fetchData() {
      setLoading(true)
      const { data: batterData, error } = await supabase
        .from('batter_stats')
        .select('*')
        .gte('total_runs', minRuns || 0)
        .order('total_runs', { ascending: false })
        .limit(50)

      if (error) console.error(error)
      else setData(batterData || [])
      setLoading(false)
    }
    fetchData()
  }, [minRuns])

  // prevent SSR mismatch
  if (!mounted) return null
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-6">Batter Statistics</h1>
      
      {/* Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="font-medium">Min Runs:</label>
        <input 
          type="number"
          value={minRuns}
          onChange={(e) => setMinRuns(Number(e.target.value))}
          className="border p-2 rounded w-32"
          placeholder="0"
        />
        <button 
          onClick={() => setMinRuns(0)}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Reset
        </button>
      </div>

      {/* if Loading */}
      {loading ? <p>Loading...</p> : (
        <div className="space-y-8">
          <BarChart 
            data={data} 
            xKey="batter" 
            yKey="total_runs" 
            title="Top Run Scorers"
          />
          
          <StatsTable 
            data={data.slice(0, 20)}
            columns={[
              { key: 'batter', label: 'Player' },
              { key: 'matches_played', label: 'Matches' },
              { key: 'total_runs', label: 'Runs' },
              { key: 'batting_average', label: 'Average' },
              { key: 'strike_rate', label: 'Strike Rate' },
              { key: 'centuries', label: '100s' },
              { key: 'half_centuries', label: '50s' },
            ]}
          />
        </div>
      )}
    </div>
  )
}