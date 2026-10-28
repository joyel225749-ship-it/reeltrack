import { Router } from "express";
import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import { makeMovieCode } from "../utils/movieCode.js";

const router = Router();
const GENRES = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller"];
const PLATFORMS = ["Netflix", "Prime Video", "Hotstar", "Theatre", "Other"];
const STATUSES = ["To Watch", "Watching", "Watched"];

const send = (res, status, success, message, data = null) =>
  res.status(status).json({ success, message, data });
const fail = (res, status, message) => send(res, status, false, message, null);
const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// Returns a validation error string, or null if inputs are valid.
function validateFields(body, { creating = false } = {}) {
  const currentYear = new Date().getFullYear();
  if (creating) {
    if (!String(body.title || "").trim()) return "Title is required.";
    if (!GENRES.includes(body.genre)) return "Choose a valid genre.";
    if (!PLATFORMS.includes(body.platform)) return "Choose a valid platform.";
    const year = Number(body.releaseYear);
    if (!Number.isInteger(year) || year < 1950 || year > currentYear)
      return `Release year must be between 1950 and ${currentYear}.`;
    const runtime = Number(body.runtime);
    if (!Number.isInteger(runtime) || runtime < 30 || runtime > 300)
      return "Runtime must be a whole number from 30 to 300 minutes.";
    const priority = Number(body.priority);
    if (!Number.isInteger(priority) || priority < 1 || priority > 5)
      return "Priority must be a whole number from 1 to 5.";
  } else {
    if (body.title !== undefined && !String(body.title || "").trim())
      return "Title is required.";
    if (body.genre !== undefined && !GENRES.includes(body.genre))
      return "Choose a valid genre.";
    if (body.platform !== undefined && !PLATFORMS.includes(body.platform))
      return "Choose a valid platform.";
    if (body.runtime !== undefined) {
      const runtime = Number(body.runtime);
      if (!Number.isInteger(runtime) || runtime < 30 || runtime > 300)
        return "Runtime must be a whole number from 30 to 300 minutes.";
    }
    if (body.priority !== undefined) {
      const priority = Number(body.priority);
      if (!Number.isInteger(priority) || priority < 1 || priority > 5)
        return "Priority must be a whole number from 1 to 5.";
    }
  }
  if (
    body.rating !== undefined &&
    body.rating !== null &&
    (!Number.isInteger(Number(body.rating)) ||
      Number(body.rating) < 1 ||
      Number(body.rating) > 10)
  )
    return "Rating must be a whole number from 1 to 10.";
  return null;
}

// GET /stats — status counts, hours watched, average rating, top watched genre
router.get("/stats", async (_req, res, next) => {
  try {
    const [statusRows, watchedRows, genreRows] = await Promise.all([
      Movie.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Movie.aggregate([
        { $match: { status: "Watched" } },
        {
          $group: {
            _id: null,
            runtime: { $sum: "$runtime" },
            averageRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]),
      Movie.aggregate([
        { $match: { status: "Watched" } },
        { $group: { _id: "$genre", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 1 },
      ]),
    ]);

    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    statusRows.forEach((row) => { counts[row._id] = row.count; });
    const watched = watchedRows[0] || { runtime: 0, averageRating: null, count: 0 };

    return send(res, 200, true, "Statistics loaded.", {
      statusCounts: counts,
      totalHoursWatched: Math.round((watched.runtime / 60) * 10) / 10,
      averageRating:
        watched.averageRating == null
          ? null
          : Math.round(watched.averageRating * 10) / 10,
      topWatchedGenre: genreRows[0]
        ? { genre: genreRows[0]._id, count: genreRows[0].count }
        : null,
      watchedCount: watched.count,
    });
  } catch (err) { next(err); }
});

// GET /watch-next — highest-priority To Watch movie; runtime is the tie-breaker
router.get("/watch-next", async (_req, res, next) => {
  try {
    const movie = await Movie.findOne({ status: "To Watch" }).sort({
      priority: -1,
      runtime: 1,
      createdAt: 1,
    });
    if (!movie) return fail(res, 404, "No movies are waiting to be watched.");
    return send(res, 200, true, "Your next movie is ready.", movie);
  } catch (err) { next(err); }
});

// GET / — paginated list with optional status/genre/search filters
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 6;
    const filter = {};
    if (req.query.status && STATUSES.includes(req.query.status))
      filter.status = req.query.status;
    if (req.query.genre && GENRES.includes(req.query.genre))
      filter.genre = req.query.genre;
    if (req.query.search) {
      const escaped = String(req.query.search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escaped, $options: "i" };
    }

    const [movies, totalMovies] = await Promise.all([
      Movie.find(filter)
        .sort({ priority: -1, runtime: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Movie.countDocuments(filter),
    ]);

    return send(res, 200, true, "Movies loaded.", {
      movies,
      page,
      limit,
      totalMovies,
      totalPages: Math.ceil(totalMovies / limit) || 1,
    });
  } catch (err) { next(err); }
});

// GET /:id — single movie
router.get("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid movie ID.");
    const movie = await Movie.findById(req.params.id);
    if (!movie) return fail(res, 404, "Movie not found.");
    return send(res, 200, true, "Movie loaded.", movie);
  } catch (err) { next(err); }
});

// POST / — add a movie (server generates movie code)
router.post("/", async (req, res, next) => {
  try {
    const errorMessage = validateFields(req.body, { creating: true });
    if (errorMessage) return fail(res, 400, errorMessage);

    const year = Number(req.body.releaseYear);
    const title = String(req.body.title).trim();

    // Pre-check duplicate before generating code to avoid wasting a sequence number.
    const duplicate = await Movie.findOne({ title, releaseYear: year }).collation({
      locale: "en",
      strength: 2,
    });
    if (duplicate)
      return fail(res, 409, "A movie with this title and release year already exists.");

    const movieCode = await makeMovieCode(year);
    const movie = await Movie.create({
      movieCode,
      title,
      genre: req.body.genre,
      releaseYear: year,
      runtime: Number(req.body.runtime),
      platform: req.body.platform,
      priority: Number(req.body.priority),
      status: "To Watch",
      rating: null,
      watchedDate: null,
    });
    return send(res, 201, true, "Movie added to your watchlist.", movie);
  } catch (err) {
    if (err.code === 11000)
      return fail(res, 409, "A movie with this title and release year already exists.");
    next(err);
  }
});

// PUT /:id — edit allowed fields only (never movie code, release year, status, rating, watched date)
router.put("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid movie ID.");
    const forbidden = ["movieCode", "releaseYear", "status", "rating", "watchedDate"];
    for (const field of forbidden) {
      if (field in req.body)
        return fail(
          res,
          400,
          "Movie code, release year, status, rating and watched date cannot be changed through the edit form."
        );
    }
    const errorMessage = validateFields(req.body);
    if (errorMessage) return fail(res, 400, errorMessage);

    const movie = await Movie.findById(req.params.id);
    if (!movie) return fail(res, 404, "Movie not found.");

    const editable = ["title", "genre", "runtime", "platform", "priority"];
    for (const key of editable) {
      if (req.body[key] !== undefined)
        movie[key] =
          key === "runtime" || key === "priority"
            ? Number(req.body[key])
            : req.body[key];
    }

    try {
      await movie.save();
    } catch (saveErr) {
      if (saveErr.code === 11000)
        return fail(res, 409, "A movie with this title and release year already exists.");
      throw saveErr;
    }
    return send(res, 200, true, "Movie updated.", movie);
  } catch (err) { next(err); }
});

// PATCH /:id/status — advance status through the allowed workflow
router.patch("/:id/status", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid movie ID.");
    const { status, rating } = req.body;
    if (!STATUSES.includes(status)) return fail(res, 400, "Choose a valid movie status.");

    const movie = await Movie.findById(req.params.id);
    if (!movie) return fail(res, 404, "Movie not found.");
    if (movie.status === "Watched")
      return fail(res, 400, "Watched is final; this movie's status cannot be changed.");

    const allowed = {
      "To Watch": ["Watching", "Watched"],
      Watching: ["Watched", "To Watch"],
      Watched: [],
    };
    if (!allowed[movie.status].includes(status))
      return fail(res, 400, `Cannot move a movie from "${movie.status}" to "${status}".`);

    if (status === "Watched") {
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 10)
        return fail(
          res,
          400,
          "A rating from 1 to 10 is required when marking a movie as Watched."
        );
      movie.rating = r;
      movie.watchedDate = new Date();
    } else if (rating !== undefined) {
      return fail(res, 400, "Rating is only allowed when moving a movie to Watched.");
    }

    movie.status = status;
    await movie.save();
    return send(res, 200, true, "Movie status updated.", movie);
  } catch (err) { next(err); }
});

// PATCH /:id/rating — edit rating for Watched movies only
router.patch("/:id/rating", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid movie ID.");
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 10)
      return fail(res, 400, "Rating must be a whole number from 1 to 10.");

    const movie = await Movie.findById(req.params.id);
    if (!movie) return fail(res, 404, "Movie not found.");
    if (movie.status !== "Watched")
      return fail(res, 400, "Only Watched movies can be rated.");

    movie.rating = rating;
    await movie.save();
    return send(res, 200, true, "Rating updated.", movie);
  } catch (err) { next(err); }
});

// DELETE /:id — refuse if status is Watching
router.delete("/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid movie ID.");
    const movie = await Movie.findById(req.params.id);
    if (!movie) return fail(res, 404, "Movie not found.");
    if (movie.status === "Watching")
      return fail(res, 400, "Movies currently being watched cannot be deleted.");
    await movie.deleteOne();
    return send(res, 200, true, "Movie deleted.", { id: movie._id });
  } catch (err) { next(err); }
});

export default router;
