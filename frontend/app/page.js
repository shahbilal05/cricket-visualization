'use client'

import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';

// Dynamic import for ForceGraph2D (client-side only)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function Home() {
  const [metrics, setMetrics] = useState(null);
  const [players, setPlayers] = useState([]);
  const [edges, setEdges] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [view, setView] = useState('overview');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const graphRef = useRef();

  useEffect(() => {
    Promise.all([
      fetch('/metrics.json').then(r => r.json()),
      fetch('/players.json').then(r => r.json()),
      fetch('/edges.json').then(r => r.json()),
      fetch('/asymmetric_matchups.json').then(r => r.json())
    ]).then(([metricsData, playersData, edgesData, matchupsData]) => {
      setMetrics(metricsData);
      setPlayers(playersData);
      setEdges(edgesData);
      setMatchups(matchupsData);

      // Prepare graph data
      const topPlayers = playersData.slice(0, 100);
      const topEdges = edgesData.slice(0, 300);

      const nodes = topPlayers.map(p => ({
        id: p.id,
        name: p.id,
        val: p.pagerank * 500,
        color: p.pagerank > 0.15 ? '#3B82F6' : '#6B7280'
      }));

      const links = topEdges
        .filter(e => 
          topPlayers.some(p => p.id === e.source) && 
          topPlayers.some(p => p.id === e.target)
        )
        .map(e => ({
          source: e.source,
          target: e.target,
          value: e.dominance
        }));

      setGraphData({ nodes, links });
      setLoading(false);
    }).catch(err => {
      console.error('Error loading data:', err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="text-white text-2xl">Loading cricket network data...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="text-white text-xl">Error loading data. Check console.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Cricket Player Network Analysis
          </h1>
          <p className="text-xl text-gray-300">
            Graph-Based Analytics  {metrics.total_players.toLocaleString()} Players • {metrics.total_interactions.toLocaleString()} Interactions
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Built with Apache Spark  {(metrics.total_deliveries_analyzed / 1000000).toFixed(2)}M+ Deliveries Analyzed
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-8 justify-center flex-wrap">
          <button
            onClick={() => setView('overview')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'overview'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
             Overview
          </button>
          <button
            onClick={() => setView('network')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'network'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
             Network Graph
          </button>
          <button
            onClick={() => setView('pagerank')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'pagerank'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
             Top Players
          </button>
          <button
            onClick={() => setView('matchups')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              view === 'matchups'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
             Asymmetric Matchups
          </button>
        </div>

        {/* Overview */}
        {view === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gradient-to-br from-blue-800 to-blue-900 p-8 rounded-xl shadow-2xl border border-blue-700">
                <h3 className="text-lg text-gray-300 mb-2">Total Players</h3>
                <p className="text-5xl font-bold">{metrics.total_players.toLocaleString()}</p>
                <p className="text-sm text-gray-400 mt-2">Unique batters and bowlers</p>
              </div>
              <div className="bg-gradient-to-br from-purple-800 to-purple-900 p-8 rounded-xl shadow-2xl border border-purple-700">
                <h3 className="text-lg text-gray-300 mb-2">Interactions</h3>
                <p className="text-5xl font-bold">{metrics.total_interactions.toLocaleString()}</p>
                <p className="text-sm text-gray-400 mt-2">Batter-bowler matchups</p>
              </div>
              <div className="bg-gradient-to-br from-pink-800 to-pink-900 p-8 rounded-xl shadow-2xl border border-pink-700">
                <h3 className="text-lg text-gray-300 mb-2">Deliveries</h3>
                <p className="text-5xl font-bold">{(metrics.total_deliveries_analyzed / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-gray-400 mt-2">Ball-by-ball records</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                <h3 className="text-2xl font-bold mb-4">Most Active Batters</h3>
                <p className="text-gray-400 mb-4 text-sm">Players who faced the most unique bowlers</p>
                <div className="space-y-2">
                  {metrics.most_active_batters.slice(0, 10).map((batter, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                      <span className="font-semibold">{idx + 1}. {batter.player}</span>
                      <span className="text-blue-400">{batter.bowlers_faced} bowlers</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
                <h3 className="text-2xl font-bold mb-4">Most Active Bowlers</h3>
                <p className="text-gray-400 mb-4 text-sm">Bowlers who bowled to the most unique batters</p>
                <div className="space-y-2">
                  {metrics.most_active_bowlers.slice(0, 10).map((bowler, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                      <span className="font-semibold">{idx + 1}. {bowler.player}</span>
                      <span className="text-purple-400">{bowler.batters_bowled_to} batters</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Network Graph */}
        {view === 'network' && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold mb-4">Player Interaction Network</h2>
            <p className="text-gray-400 mb-6">
              Top 100 Cricketers by PageRank. Node size = influence. Click nodes to explore.
            </p>
            <div className="bg-gray-900 rounded-xl overflow-hidden" style={{ height: '700px' }}>
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeLabel="name"
                nodeAutoColorBy="color"
                nodeVal="val"
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const label = node.name;
                  const fontSize = 10 / globalScale;
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.fillStyle = node.color;
                  ctx.textAlign = 'center';
                  ctx.fillText(label, node.x, node.y + 4);
                  
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, node.val / 50, 0, 2 * Math.PI, false);
                  ctx.fillStyle = node.color;
                  ctx.fill();
                }}
                linkWidth={link => Math.max(link.value / 5, 0.5)}
                linkColor={() => 'rgba(100, 116, 139, 0.3)'}
                backgroundColor="#111827"
                onNodeClick={node => {
                  alert(`Player: ${node.id}\nPageRank: ${(node.val / 500).toFixed(4)}`);
                }}
              />
            </div>
          </div>
        )}

        {/* PageRank */}
        {view === 'pagerank' && (
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold mb-6">Top Players by Network Influence</h2>
            <p className="text-gray-400 mb-6">
              PageRank reveals cricketers who shaped outcomes across the most opponents
            </p>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={metrics.top_players_by_pagerank.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="player" 
                  stroke="#9CA3AF" 
                  angle={-45} 
                  textAnchor="end" 
                  height={150}
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="score" fill="#3B82F6" name="Influence Score" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.top_players_by_pagerank.slice(0, 20).map((player, idx) => (
                <div key={idx} className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-400">#{idx + 1} {player.player}</span>
                    <span className="text-2xl font-bold text-white">{player.score.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Asymmetric Matchups */}
        {view === 'matchups' && (
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold mb-6">Asymmetric Batter-Bowler Matchups</h2>
            <p className="text-gray-400 mb-6">
              Batters who dominated specific quality bowlers despite those bowlers overall success
            </p>
            
            <div className="space-y-4">
              {matchups.slice(0, 20).map((matchup, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 rounded-lg hover:from-blue-900 hover:to-gray-700 transition-all border border-gray-600"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-blue-400 mb-2">
                        {matchup.batter} vs {matchup.bowler}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-gray-400 text-sm">Runs</p>
                          <p className="text-xl font-bold text-green-400">{matchup.runs}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Balls</p>
                          <p className="text-xl font-bold">{matchup.balls}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Dismissals</p>
                          <p className="text-xl font-bold text-red-400">{matchup.dismissals}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Strike Rate</p>
                          <p className="text-xl font-bold text-purple-400">{matchup.strike_rate.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-gray-400 text-sm">Dominance</p>
                      <p className="text-4xl font-bold text-yellow-400">{matchup.dominance.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-gray-400 border-t border-gray-700 pt-8">
          <p className="text-lg font-semibold mb-2">Ball-by-Ball Cricket Network Analysis</p>
          <p className="text-sm">Using Apache Spark React Recharts</p>
        </div>
      </div>
    </div>
  );
}