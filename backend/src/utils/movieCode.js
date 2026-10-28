import Sequence from "../models/Sequence.js";

// Atomically fetch-and-increment a per-year sequence counter.
// First call for a year returns 1 (→ "001"), second returns 2, and so on.
export async function makeMovieCode(year) {
  const doc = await Sequence.findOneAndUpdate(
    { _id: year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `MV-${year}-${String(doc.seq).padStart(3, "0")}`;
}
