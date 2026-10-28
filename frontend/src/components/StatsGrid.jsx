import { Film, Clock3, Star, BarChart3 } from "lucide-react";

export default function StatsGrid({ stats }) {
  const statusTotals = stats?.statusCounts || { "To Watch": 0, Watching: 0, Watched: 0 };
  const totalMovies = Object.values(statusTotals).reduce((a, b) => a + b, 0);
  const watchedCount = stats?.statusCounts?.Watched || 0;

  return (
    <section className="stats-grid">
      <div className="stat-card stat-total">
        <span className="stat-icon">
          <Film size={18} />
        </span>
        <span className="stat-label">IN YOUR UNIVERSE</span>
        <strong>{stats ? totalMovies : "—"}</strong>
        <small>Total movies collected</small>
      </div>
      <div className="stat-card">
        <span className="stat-icon amber">
          <Clock3 size={18} />
        </span>
        <span className="stat-label">TIME WELL SPENT</span>
        <strong>
          {stats ? stats.totalHoursWatched : "—"}
          <small className="inline-unit"> hrs</small>
        </strong>
        <small>Runtime of watched films</small>
      </div>
      <div className="stat-card">
        <span className="stat-icon violet">
          <Star size={18} />
        </span>
        <span className="stat-label">YOUR AVERAGE RATING</span>
        <strong>
          {stats?.averageRating ?? "—"}
          <small className="inline-unit"> / 10</small>
        </strong>
        <small>Across {watchedCount} watched films</small>
      </div>
      <div className="stat-card">
        <span className="stat-icon green">
          <BarChart3 size={18} />
        </span>
        <span className="stat-label">TOP WATCHED GENRE</span>
        <strong className="genre-stat">
          {stats?.topWatchedGenre?.genre || "—"}
        </strong>
        <small>
          {stats?.topWatchedGenre
            ? `${stats.topWatchedGenre.count} film${
                stats.topWatchedGenre.count === 1 ? "" : "s"
              } watched`
            : "Your next favourite awaits"}
        </small>
      </div>
    </section>
  );
}
