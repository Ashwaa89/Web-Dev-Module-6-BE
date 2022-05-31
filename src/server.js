import express from "express";
import createError from "http-errors"
import listEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import expressSession from "express-session";
import blogAuthorRouter from "./services/blog/authors/index.js";
import blogPostRouter from "./services/blog/posts/index.js";
import { errorHandler } from "./errorHandler.js";
import passport from "passport"
import GooglePassport from "./services/auth/OAuth.js";
import cors from "cors";
const server = express();
const port =  process.env.PORT;
passport.use("google",GooglePassport)
server.use(express.json());
server.use(passport.initialize());
server.use(expressSession({ secret:"1234"}))
server.use(errorHandler);
const whitelist = [process.env.FE_URL]
server.use(cors({
  origin: (origin, next) => {
    console.log("CURRENT ORIGIN: ", origin)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      next(null, true)
    } else {    
      next(createError(400, `CORS ERROR! Your origin: ${origin} is not in the whitelist!`))
    }
  
  },
}))
server.use("/blogAuthor", blogAuthorRouter);
server.use("/blogPosts", blogPostRouter);
mongoose.connect(process.env.MONGO_CONNECTION_STRING);
mongoose.connection.on("connected", () => {
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(process.env.PORT)
    console.log(process.env.FE_URL)
    console.log(process.env.BE_URL)
    console.log("server sez hi");
  });
});
