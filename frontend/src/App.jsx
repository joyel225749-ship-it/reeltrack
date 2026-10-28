import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clapperboard,
  Film,
  Plus,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";
import { api } from "./api.js";
import { GENRES, STATUSES } from "./constants.js";
import MovieForm from "./components/MovieForm.jsx";
import StatusEditor from "./components/StatusEditor.jsx";
import MovieCard from "./components/MovieCard.jsx";
import StatsGrid from "./components/StatsGrid.jsx";
import Spotlight from "./components/Spotlight.jsx";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [formMovie, setFormMovie] = useState(undefined);
  const [statusMovie, setStatusMovie] = useState(null);
  const [spotlight, setSpotlight] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const statusTotals = useMemo(
    () => stats?.statusCounts || { "To Watch": 0, Watching: 0, Watched: 0 },
    [stats]
  );

  const loadMovies = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = { page: String(page), limit: "6" };
    if (statusFilter) params.status = statusFilter;
    if (genreFilter) params.genre = genreFilter;
    if (querySearch) params.search = querySearch;
    try {
      const result = await api.listMovies(params);
      setMovies(result.data.movies);
      setPages(Math.max(1, result.data.totalPages));
      setTotal(result.data.totalMovies);
    } catch (err) {
      setError(
        `${err.message} — Check that the backend is running and VITE_API_URL is correct.`
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, genreFilter, querySearch]);

  const loadStats = useCallback(async () => {
    try {
      const result = await api.getStats();
      setStats(result.data);
    } catch (err) {
      console.error("Stats error:", err.message);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadMovies(), loadStats()]);
  }, [loadMovies, loadStats]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  function saved(message) {
    setNotice(message);
    setSpotlight(null);
    refreshAll();
  }

  async function watchNext() {
    try {
      const result = await api.watchNext();
      setSpotlight(result.data);
      setNotice("");
    } catch (err) {
      setSpotlight(null);
      setNotice(err.message);
    }
  }

  async function deleteMovie(movie) {
    if (
      !window.confirm(
        `Delete "${movie.title}" from your watchlist? This cannot be undone.`
      )
    )
      return;
    try {
      const result = await api.deleteMovie(movie._id);
      saved(result.message);
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function rateMovie(movie, rating) {
    try {
      const result = await api.updateRating(movie._id, rating);
      saved(result.message);
    } catch (err) {
      setNotice(err.message);
    }
  }

  function clearFilters() {
    setStatusFilter("");
    setGenreFilter("");
    setSearch("");
    setQuerySearch("");
    setPage(1);
  }

  const activeFilter = Boolean(statusFilter || genreFilter || querySearch);
  const totalShowing = movies.length;
  const firstItem = totalShowing ? (page - 1) * 6 + 1 : 0;
  const lastItem = Math.min(page * 6, total);

  return (
    <main className="app-shell">
      {/* Top navigation bar */}
      <header className="topbar">
        <a href="#" className="brand">
          <span className="brand-icon">
            <Clapperboard size={20} />
          </span>
          <span>
            reel<span className="brand-accent">track</span>
            <small>YOUR PERSONAL MOVIE UNIVERSE</small>
          </span>
        </a>
        <div className="topbar-right">
          <span className="live-dot" aria-hidden="true" />
          YOUR PRIVATE WATCHLIST
          <button className="avatar" aria-label="User menu">
            R
          </button>
        </div>
      </header>

      {/* Hero section */}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> YOUR NEXT GREAT STORY STARTS HERE
          </span>
          <h1>
            Every film.<br />
            One <em>universe.</em>
          </h1>
          <p>
            A little place for all the stories you want to experience. Keep your
            list close, your priorities clear, and your next movie just one click
            away.
          </p>
          <div className="hero-buttons">
            <button
              className="button primary"
              onClick={() => setFormMovie(null)}
            >
              <Plus size={17} /> Add a movie
            </button>
            <button className="button outline" onClick={watchNext}>
              <Sparkles size={16} /> What should I watch next?
            </button>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-film">
            <Film size={66} strokeWidth={1.1} />
            <span>YOUR NEXT<br />FAVOURITE FILM</span>
          </div>
          <span className="floating-chip chip-top">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            YOUR TASTE, YOUR RULES
          </span>
          <span className="floating-chip chip-bottom">
            <Clapperboard size={14} /> THE SHOW GOES ON
          </span>
        </div>
      </section>

      {/* Stats grid */}
      <StatsGrid stats={stats} />

      {/* Progress strip */}
      <section className="progress-strip">
        <div className="progress-title">
          <span className="eyebrow">THE BIG PICTURE</span>
          <strong>Your viewing journey</strong>
        </div>
        {STATUSES.map((s) => {
          const count = statusTotals[s] || 0;
          const grandTotal = Object.values(statusTotals).reduce((a, b) => a + b, 0);
          return (
            <div className="progress-item" key={s}>
              <div className="progress-label">
                <span>{s}</span>
                <strong>{count}</strong>
              </div>
              <div className="progress-track">
                <span
                  className={`progress-fill fill-${s
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                  style={{
                    width: `${(count / Math.max(1, grandTotal)) * 100}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* Watch Next spotlight */}
      {spotlight && (
        <Spotlight
          movie={spotlight}
          onWatch={() => {
            setStatusMovie(spotlight);
            setSpotlight(null);
          }}
          onClose={() => setSpotlight(null)}
        />
      )}

      {/* Notification banners */}
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}
      {error && (
        <div className="notice error-notice" role="alert">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss error">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Movie library */}
      <section className="library-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE COLLECTION</span>
            <h2>
              Your watchlist
              <span className="heading-count">{total}</span>
            </h2>
            <p>Stories waiting to be discovered, one frame at a time.</p>
          </div>
          <button
            className="button primary add-mobile"
            onClick={() => setFormMovie(null)}
          >
            <Plus size={16} /> Add movie
          </button>
        </div>

        {/* Toolbar: search + filters */}
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} aria-hidden="true" />
            <input
              placeholder="Search your movies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setQuerySearch(search.trim());
                }
              }}
              aria-label="Search movies"
            />
            <button
              className="search-go"
              onClick={() => {
                setPage(1);
                setQuerySearch(search.trim());
              }}
            >
              Search
            </button>
          </div>
          <div className="filter-group">
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              aria-label="Filter by genre"
              value={genreFilter}
              onChange={(e) => {
                setPage(1);
                setGenreFilter(e.target.value);
              }}
            >
              <option value="">All genres</option>
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <button
              className="icon-btn refresh-btn"
              title="Refresh data"
              aria-label="Refresh"
              onClick={refreshAll}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="collection-caption">
          <span>{activeFilter ? "FILTERED RESULTS" : "YOUR FILM SHELF"}</span>
          <span>
            PAGE {page} OF {pages}
          </span>
        </div>

        {/* Movie grid or empty/loading states */}
        {loading ? (
          <div className="empty-state">
            <RefreshCw className="spin" size={24} aria-hidden="true" />
            <p>Finding your films…</p>
          </div>
        ) : movies.length ? (
          <div className="movie-grid">
            {movies.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                onEdit={setFormMovie}
                onStatus={setStatusMovie}
                onDelete={deleteMovie}
                onRate={rateMovie}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Film size={36} aria-hidden="true" />
            <h3>
              {activeFilter
                ? "No films match those filters"
                : "Your first feature starts here"}
            </h3>
            <p>
              {activeFilter
                ? "Try a different search or clear one of the filters."
                : "Add a movie you have been meaning to watch. Your future movie-night self says thanks."}
            </p>
            {activeFilter ? (
              <button className="button secondary" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <button
                className="button primary"
                onClick={() => setFormMovie(null)}
              >
                <Plus size={16} /> Add your first movie
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        <div className="pagination">
          <span>
            Showing {firstItem}–{lastItem} of {total} movies
          </span>
          <div>
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={17} />
            </button>
            <span className="page-number" aria-current="page">
              {page}
            </span>
            <button
              className="page-btn"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <a href="#" className="brand footer-brand">
          <span className="brand-icon">
            <Clapperboard size={17} />
          </span>
          <span>
            reel<span className="brand-accent">track</span>
          </span>
        </a>
        <span>
          MADE FOR THE LOVE OF STORIES{" "}
          <span className="footer-star" aria-hidden="true">
            ✳
          </span>
        </span>
        <span>YOUR NEXT CHAPTER IS A FILM AWAY.</span>
      </footer>

      {/* Modals */}
      {formMovie !== undefined && (
        <MovieForm
          initial={formMovie}
          onClose={() => setFormMovie(undefined)}
          onSaved={saved}
        />
      )}
      {statusMovie && (
        <StatusEditor
          movie={statusMovie}
          onClose={() => setStatusMovie(null)}
          onSaved={saved}
        />
      )}
    </main>
  );
}
