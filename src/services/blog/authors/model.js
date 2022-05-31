import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const blogAuthorsSchema = new Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    dateOfBirth: { type: Date, required: false },
    password: { type: String, required: false },
    avatar: { type: String },
    role: { type: String, required: true, default: "User", enum: ["User", "Admin"] },
    googleId: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);
//Hash password for new author
blogAuthorsSchema.pre("save", async function (next) {
  if (this.isModified("password")) {   
    this.password =  await bcrypt.hash(this.password, 10)
  }
  next()
})
//Remove columns from request
blogAuthorsSchema.methods.toJSON = function () {
  const author = this
  delete author.toObject().password
  delete author.__v
  return author
}
//Check checkCredentials on login
blogAuthorsSchema.statics.checkCredentials = async function (email, plainPw) {
const author = await this.findOne({ email })
console.log(email)
if (author) {    
if (await bcrypt.compare(plainPw, author.password)) {
return author
} else {
return null
}
} else {
return null
}
}



//name of collection in DB, schema
export default model("blogAuthors", blogAuthorsSchema);
