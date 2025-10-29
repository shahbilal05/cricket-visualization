'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BarChart from '@/components/BarChart'
import StatsTable from '@/components/StatsTable'

export default function MatchStatsPage() {
  const [data, setData] = useState<any[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      let query = supabase.from('match_stats').select('*').order('match_date', { ascending: false })
      
      if (selectedTeam !== 'All') {
        query = query.eq('batting_team', selectedTeam)
      }
      
      const { data: matchData, error } = await query
      if (error) console.error(error)
      else {
        setData(matchData || [])
        const uniqueTeams = [...new Set(matchData?.map(m => m.batting_team) || [])]
        setTeams(uniqueTeams.sort())
      }
      setLoading(false)
    }
    fetchData()
  }, [selectedTeam])

  // aggregate: total runs per team
  const teamTotals = data.reduce((acc: any, match) => {
    const team = match.batting_team
    if (!acc[team]) acc[team] = { batting_team: team, total_runs: 0, matches: 0 }
    acc[team].total_runs += match.total_score
    acc[team].matches += 1
    return acc
  }, {})
  
  const teamData = Object.values(teamTotals).sort((a: any, b: any) => b.total_runs - a.total_runs)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-6">Match Statistics</h1>
      
      <div className="mb-6 flex gap-4">
        <select 
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="border p-2 rounded"
        >
          <option>All</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button 
          onClick={() => setSelectedTeam('All')}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Reset
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="space-y-8">
          <BarChart 
            data={teamData} 
            xKey="batting_team" 
            yKey="total_runs" 
            title="Total Runs by Team"
          />
          
          <StatsTable 
            data={data.slice(0, 20)}
            columns={[
              { key: 'match_date', label: 'Date' },
              { key: 'batting_team', label: 'Team' },
              { key: 'venue', label: 'Venue' },
              { key: 'total_score', label: 'Score' },
              { key: 'wickets', label: 'Wickets' },
              { key: 'overs', label: 'Overs' },
            ]}
          />
        </div>
      )}
    </div>
  )
}