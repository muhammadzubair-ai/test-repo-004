import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const securityQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    answerHash: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    securityQuestions: {
      type: [securityQuestionSchema],
      default: undefined,
      validate: {
        validator(entries: unknown[] | undefined) {
          if (entries == null) return true;
          return entries.length === 4;
        },
        message: "securityQuestions must contain exactly 4 entries",
      },
    },
  },
  { timestamps: true },
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model("User", userSchema);

export const toPublicUser = (user: UserDoc) => ({ id: user.id as string, name: user.name, email: user.email });
