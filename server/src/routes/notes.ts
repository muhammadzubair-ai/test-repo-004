import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { requireAuth } from "../middleware/auth.js";
import { Note, toPublicNote } from "../models/note.js";

export const notesRouter = Router();
notesRouter.use(requireAuth);

const CreateNote = z.object({ title: z.string().trim().min(1).max(120), body: z.string().max(5000).optional() });

notesRouter.get("/", async (_req, res) => {
  const notes = await Note.find({ owner: res.locals.userId }).sort({ createdAt: -1 });
  res.json({ notes: notes.map(toPublicNote) });
});

notesRouter.post("/", async (req, res) => {
  const input = CreateNote.parse(req.body);
  const note = await Note.create({ owner: res.locals.userId, title: input.title, body: input.body ?? "" });
  res.status(201).json({ note: toPublicNote(note) });
});

notesRouter.delete("/:id", async (req, res) => {
  if (!isValidObjectId(req.params.id)) throw new HttpError(404, "Not found");
  const deleted = await Note.findOneAndDelete({ _id: req.params.id, owner: res.locals.userId });
  if (!deleted) throw new HttpError(404, "Not found");
  res.status(204).end();
});
