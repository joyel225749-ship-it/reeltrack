import { useState } from "react";
import { X } from "lucide-react";
import { api } from "../api.js";

export default function StatusEditor({ movie, onClose, onSaved }) {
  const options =
    movie.status === "To Watch"
      ? ["Watching", "Watched"]
      : movie.status === "Watching"
      ? ["Watched", "To Watch"]
      : [];
  const [status, setStatus] = useState(options[0] || "");
  const [rating, setRating] = useState("8");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (options.length === 0) return null;

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (status === "Watched") {
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 10)
        return setError("Please enter a rating from 1 to 10.");
    }
    setBusy(true);
    try {
      const payload = { status };
      if (status === "Watched") payload.rating = Number(rating);
      const result = await api.updateStatus(movie._id, payload);
      onSaved(result.message);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section className="modal small-modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">UPDATE PROGRESS</span>
            <h2>Move your movie</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        <p className="muted">{movie.title}</p>
        <form onSubmit={submit} className="movie-form">
          <label className="wide">
            New status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="New status"
            >
              {options.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          {status === "Watched" && (
            <label className="wide">
              Your rating (1–10)
              <input
                type="number"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                required
              />
            </label>
          )}
          {error && <p className="form-error wide">{error}</p>}
          <div className="form-actions wide">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? "Updating…" : "Update status"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
