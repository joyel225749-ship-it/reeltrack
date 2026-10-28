import { useState } from "react";
import { Plus, X } from "lucide-react";
import { api } from "../api.js";
import { GENRES, PLATFORMS, BLANK_MOVIE, CURRENT_YEAR } from "../constants.js";

export default function MovieForm({ initial, onClose, onSaved }) {
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState(
    editing
      ? {
          title: initial.title,
          genre: initial.genre,
          releaseYear: String(initial.releaseYear),
          runtime: String(initial.runtime),
          platform: initial.platform,
          priority: String(initial.priority),
        }
      : BLANK_MOVIE
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    const year = Number(form.releaseYear);
    const runtime = Number(form.runtime);
    const priority = Number(form.priority);
    if (!form.title.trim()) return setError("Give your movie a title.");
    if (!editing && (!Number.isInteger(year) || year < 1950 || year > CURRENT_YEAR))
      return setError(`Release year must be between 1950 and ${CURRENT_YEAR}.`);
    if (!Number.isInteger(runtime) || runtime < 30 || runtime > 300)
      return setError("Runtime must be between 30 and 300 minutes.");
    if (!Number.isInteger(priority) || priority < 1 || priority > 5)
      return setError("Priority must be between 1 and 5.");
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        genre: form.genre,
        runtime,
        platform: form.platform,
        priority,
      };
      if (!editing) payload.releaseYear = year;
      const result = editing
        ? await api.editMovie(initial._id, payload)
        : await api.addMovie(payload);
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
      <section className="modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              {editing ? "REFINE YOUR LIST" : "ADD TO YOUR UNIVERSE"}
            </span>
            <h2>{editing ? "Edit movie" : "Add a movie"}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit} className="movie-form">
          <label className="wide">
            Movie title
            <input
              name="title"
              value={form.title}
              onChange={change}
              placeholder="e.g. Interstellar"
              maxLength={120}
              required
            />
          </label>
          <label>
            Genre
            <select name="genre" value={form.genre} onChange={change}>
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label>
            Release year
            <input
              name="releaseYear"
              type="number"
              min="1950"
              max={CURRENT_YEAR}
              value={form.releaseYear}
              onChange={change}
              disabled={editing}
              required
            />
          </label>
          <label>
            Runtime (minutes)
            <input
              name="runtime"
              type="number"
              min="30"
              max="300"
              value={form.runtime}
              onChange={change}
              required
            />
          </label>
          <label>
            Streaming platform
            <select name="platform" value={form.platform} onChange={change}>
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="wide">
            Watch priority
            <div className="priority-picker">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  type="button"
                  key={v}
                  className={
                    Number(form.priority) >= v
                      ? "priority-star selected"
                      : "priority-star"
                  }
                  onClick={() => setForm({ ...form, priority: String(v) })}
                  aria-label={`Priority ${v}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={Number(form.priority) >= v ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
              <span>
                {["", "Whenever", "Low", "Medium", "High", "Must watch"][
                  Number(form.priority)
                ]}
              </span>
            </div>
          </label>
          {error && <p className="form-error wide">{error}</p>}
          <div className="form-actions wide">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="button primary" disabled={busy}>
              {busy ? "Saving…" : editing ? (
                "Save changes"
              ) : (
                <>
                  <Plus size={17} /> Add movie
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
