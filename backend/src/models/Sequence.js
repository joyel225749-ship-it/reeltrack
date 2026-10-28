import mongoose from "mongoose";

const sequenceSchema = new mongoose.Schema(
  { _id: { type: Number, required: true }, seq: { type: Number, default: 0 } },
  { versionKey: false }
);

export default mongoose.model("Sequence", sequenceSchema);
