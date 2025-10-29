'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BarChart from '@/components/BarChart'
import StatsTable from '@/components/StatsTable'

export default function BowlerStatsPage() {
  const [data, setData] = useState<any[]>([])
  const [minWickets, setMinWickets] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: bowlerData, error } = await supabase
        .from('bowler_stats')
        .select('*')
        .gte('wickets_taken', minWickets || 0)
        .order('wickets_taken', { ascending: false })
        .limit(50)
      
      if (error) console.error(error)
      else setData(bowlerData || [])
      setLoading(false)
    }

    if (minWickets !== null) fetchData()
  }, [minWickets])
  
  // render input after hydration
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-6">Bowler Statistics</h1>
      
      {/* Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <label className="font-medium">Min Wickets:</label>
        <input
          type="number"
          value={minWickets}
          
          onChange={(e) => setMinWickets(Number(e.target.value))}
          className="border p-2 rounded w-32"
          placeholder="0"
        />
        <button 
          onClick={() => setMinWickets(0)}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Reset
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="space-y-8">
          <BarChart 
            data={data} 
            xKey="bowler" 
            yKey="wickets_taken" 
            title="Top Wicket Takers"
          />
          
          <StatsTable 
            data={data.slice(0, 20)}
            columns={[
              { key: 'bowler', label: 'Player' },
              { key: 'matches_played', label: 'Matches' },
              { key: 'wickets_taken', label: 'Wickets' },
              { key: 'bowling_average', label: 'Average' },
              { key: 'economy_rate', label: 'Economy' },
              { key: 'strike_rate', label: 'Strike Rate' },
              { key: 'five_wickets', label: '5W' },
            ]}
          />
        </div>
      )}
    </div>
  )
}