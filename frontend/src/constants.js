export const GENRES = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller"];
export const PLATFORMS = ["Netflix", "Prime Video", "Hotstar", "Theatre", "Other"];
export const STATUSES = ["To Watch", "Watching", "Watched"];
export const CURRENT_YEAR = new Date().getFullYear();
export const BLANK_MOVIE = {
  title: "",
  genre: "Drama",
  releaseYear: String(CURRENT_YEAR),
  runtime: "120",
  platform: "Netflix",
  priority: "3",
};
