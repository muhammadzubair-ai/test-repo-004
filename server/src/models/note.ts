import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

// A placeholder model so the API has something owned by a user; replace it with the first real model.
const noteSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, default: "", maxlength: 5000 },
  },
  { timestamps: true },
);

export type NoteDoc = HydratedDocument<InferSchemaType<typeof noteSchema>>;
export const Note = model("Note", noteSchema);

export const toPublicNote = (note: NoteDoc) => ({
  id: note.id as string,
  title: note.title,
  body: note.body,
  createdAt: note.createdAt.toISOString(),
});
