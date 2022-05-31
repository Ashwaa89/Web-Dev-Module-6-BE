import mongoose from "mongoose";
const { Schema, model } = mongoose;
const blogPostSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    cover: { type: String },
    readTime: {
      value: { type: Number },
      unit: { type: String },
    },
    author: {
      name: { type: String },
      avatar: { type: String },
    },
    content: { type: String, required: true },
    author: [{ type: mongoose.Types.ObjectId, ref: "blogAuthors" }],
    comments: [{ user: String, content: String, dateAdded: Date }],
  },
  {
    timestamps: true,
  }
);
//name of collection in DB, schema
export default model("blogPosts", blogPostSchema);
