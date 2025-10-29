'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Cricket Analytics Dashboard</h1>
        <p className="text-xl text-gray-600 mb-12">Explore match statistics, player performance, and insights from 1.3M ball-by-ball records</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/match-stats" className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">Match Stats</h2>
            <p className="text-gray-600">Team performance, scores, and match outcomes</p>
          </Link>
          
          <Link href="/batter-stats" className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold text-green-600 mb-2">Batter Stats</h2>
            <p className="text-gray-600">Top run scorers, averages, and strike rates</p>
          </Link>
          
          <Link href="/bowler-stats" className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-bold text-purple-600 mb-2">Bowler Stats</h2>
            <p className="text-gray-600">Wicket takers, economy rates, and dot balls</p>
          </Link>
        </div>
      </div>
    </div>
  )
}