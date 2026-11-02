import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const shareSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    permission: { type: String, required: true, enum: ["read", "write"] },
  },
  { _id: false },
);

const memoSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    content: { type: String },
    sharedWith: { type: [shareSchema], default: [] },
  },
  { timestamps: true },
);

memoSchema.index({ "sharedWith.user": 1 });

export type MemoDoc = HydratedDocument<InferSchemaType<typeof memoSchema>>;
export const Memo = model("Memo", memoSchema);
