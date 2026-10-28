import { useState } from "react";
import {
  Clapperboard,
  Star,
  Pencil,
  Trash2,
  Play,
  Check,
} from "lucide-react";

function StatusPill({ status }) {
  return (
    <span
      className={`status status-${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      {status}
    </span>
  );
}

export default function MovieCard({ movie, onEdit, onStatus, onDelete, onRate }) {
  const [rating, setRating] = useState(String(movie.rating || 8));
  const [ratingMode, setRatingMode] = useState(false);
  const genreClass = movie.genre
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("+", "x");

  return (
    <article className="movie-card">
      <div className={`poster-art poster-${genreClass}`}>
        <span className="poster-mark">
          <Clapperboard size={24} />
        </span>
        <span className="poster-year">{movie.releaseYear}</span>
        <span className="poster-genre">{movie.genre}</span>
        <span className="poster-code">{movie.movieCode}</span>
      </div>
      <div className="movie-info">
        <div className="movie-topline">
          <StatusPill status={movie.status} />
          <span className="priority-label">
            <Star size={13} fill="currentColor" /> {movie.priority}/5
          </span>
        </div>
        <h3 title={movie.title}>{movie.title}</h3>
        <p className="movie-meta">
          <span>{movie.genre}</span>
          <i />
          <span>{movie.runtime} min</span>
          <i />
          <span>{movie.platform}</span>
        </p>
        <div className="movie-bottom">
          {movie.status === "Watched" ? (
            <div className="rating-line">
              <Star size={15} fill="currentColor" />
              <strong>{movie.rating ?? "—"}</strong>
              <span>/ 10</span>
              {ratingMode && (
                <div className="rating-edit">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    aria-label="New rating"
                  />
                  <button
                    onClick={() => {
                      const r = Number(rating);
                      if (r >= 1 && r <= 10) {
                        onRate(movie, r);
                        setRatingMode(false);
                      }
                    }}
                    aria-label="Save rating"
                  >
                    <Check size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="text-action" onClick={() => onStatus(movie)}>
              <Play size={13} /> Update progress
            </button>
          )}
          <div className="card-actions">
            <button
              className="icon-btn"
              title="Edit movie"
              aria-label="Edit movie"
              onClick={() => onEdit(movie)}
            >
              <Pencil size={15} />
            </button>
            {movie.status === "Watched" && (
              <button
                className="icon-btn"
                title="Edit rating"
                aria-label="Edit rating"
                onClick={() => setRatingMode((m) => !m)}
              >
                <Star size={15} />
              </button>
            )}
            <button
              className="icon-btn danger-icon"
              title={
                movie.status === "Watching"
                  ? "Cannot delete a movie being watched"
                  : "Delete movie"
              }
              aria-label={
                movie.status === "Watching" ? "Delete disabled" : "Delete movie"
              }
              disabled={movie.status === "Watching"}
              onClick={() => onDelete(movie)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
