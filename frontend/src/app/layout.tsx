import type { Metadata } from "next";
import "../styles/globals.css"; 

export const metadata: Metadata = {
  title: "Cricket Analytics Dashboard",
  description: "Interactive cricket statistics and visualizations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="bg-gray-900 text-white p-4">
          <div className="max-w-7xl mx-auto flex gap-6">
            <a href="/" className="hover:text-blue-400">Home</a>
            <a href="/match-stats" className="hover:text-blue-400">Match Stats</a>
            <a href="/batter-stats" className="hover:text-blue-400">Batter Stats</a>
            <a href="/bowler-stats" className="hover:text-blue-400">Bowler Stats</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}