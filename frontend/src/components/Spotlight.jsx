import { Sparkles, Play, X } from "lucide-react";

export default function Spotlight({ movie, onWatch, onClose }) {
  if (!movie) return null;
  return (
    <section className="spotlight">
      <div className="spotlight-symbol">
        <Sparkles size={22} />
      </div>
      <div className="spotlight-copy">
        <span className="eyebrow">
          TONIGHT'S PICK · PRIORITY {movie.priority}/5
        </span>
        <h2>{movie.title}</h2>
        <p>
          {movie.releaseYear} · {movie.genre} · {movie.runtime} minutes ·{" "}
          {movie.platform}
        </p>
        <span className="spotlight-code">{movie.movieCode}</span>
      </div>
      <button className="button primary" onClick={onWatch}>
        Let's watch <Play size={15} />
      </button>
      <button className="icon-btn" onClick={onClose} aria-label="Dismiss">
        <X size={18} />
      </button>
    </section>
  );
}
