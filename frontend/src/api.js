const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.message || "Request failed.");
  return json;
}

export const api = {
  listMovies: (params) => request(`/movies?${new URLSearchParams(params)}`),
  getStats: () => request("/movies/stats"),
  watchNext: () => request("/movies/watch-next"),
  addMovie: (data) => request("/movies", { method: "POST", body: JSON.stringify(data) }),
  editMovie: (id, data) => request(`/movies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id, data) => request(`/movies/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),
  updateRating: (id, rating) => request(`/movies/${id}/rating`, { method: "PATCH", body: JSON.stringify({ rating }) }),
  deleteMovie: (id) => request(`/movies/${id}`, { method: "DELETE" }),
};
