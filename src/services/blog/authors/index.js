import express from "express";
import createError from "http-errors";
import blogAuthorsModel from "./model.js";
import { checkBlogAuthor, checkValidationResult } from "./validation.js";
import q2m from "query-to-mongo";
import passport from "passport"
import { upload } from "../../image/imageupload.js"
import { sendEmail } from "../../email/sendemail.js";
import { generateToken,checkAuth,isAdmin } from "../../auth/auth.js"
const blogAuthors = express.Router();





//Register
//Insert
blogAuthors.post(
  "/register",
  checkBlogAuthor,
  checkValidationResult,
  async (req, res, next) => {
    try {
      console.log(req.body)
      const newblogAuthor = new blogAuthorsModel(req.body);
      const savedblogAuthor = await newblogAuthor.save();   
      
      console.log(savedblogAuthor)
          // To: savedblogAuthor.email
      sendEmail(process.env.FROM_ADDRESS,"Account Created", `Welcome ${savedblogAuthor.name}`,`<h4>Happy Posting</h4>`)
     
      res.send({ accessToken: await generateToken({ _id: savedblogAuthor._id, role: savedblogAuthor.role }),name:savedblogAuthor.name })
    
    } catch (error) {
      next(error);
    }
  }
);
//Login
blogAuthors.post("/login", async (req, res, next) => {
  try {
    const user = await blogAuthorsModel.checkCredentials(req.body.email, req.body.password)
    if (user) {   
      res.send({ accessToken: await generateToken({ _id: user._id, role: user.role }),name:user.name })
    } else {   
next(createError(401, "Unauthorised"))
    }
  } catch (error) {
    next(error)
  }
})
//Get Current User
blogAuthors.get("/me", checkAuth, async (req, res, next) => {
  try {
    res.send({ user: await blogAuthorsModel.findById(req.user._id) })
  } catch (error) {
    next(error)
  }
})


//update my account
blogAuthors.put("/me", blogAuthors, async (req, res, next) => {
  try {
    const blogAuthor = await blogAuthorsModel.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true }
    );
    if (blogAuthor) {
      res.send(blogAuthor);
    } else {
      next(createError(404, `Blog Author (${req.user._id}) not found`));
    }
  } catch (error) {
    next(error);
  }

})
//delete my account
blogAuthors.delete("/me", checkAuth, async (req, res, next) => {
  try {
    const blogAuthor = await blogAuthorsModel.findById(req.user._id);
    if (blogAuthor) {
      res.status(204).send();
    } else {
      next(createError(404, `Blog Author (${req.user._id}) not found`));
    }
  } catch (error) {
    next(error);
  }

})

//Google Login
blogAuthors.get("/googleLogin", passport.authenticate("google", { scope: ["profile", "email"] }))

//Google Redirect
blogAuthors.get("/googleRedirect", passport.authenticate("google"), async (req, res, next) => {

  try {
  console.log(req.user.accessToken)
    res.redirect(`${process.env.FE_URL}/googleredirect?accessToken=${req.user.accessToken}&name=${req.user.name}`)
  } catch (error) {
    next(error)
  }
})
//set my Avatar
blogAuthors.put("/avatar/",checkAuth,upload('avatars'),  async (req,res, next) => {
  try {
    //localhost:3001/blogAuthor/6271767063696192aa9869f1/avatar
    const blogAuthor = await blogAuthorsModel.findByIdAndUpdate(
      req.user._id,
     {$set:{"avatar":req.file.path}},
      { new: true }
    );
    if (blogAuthor) {
      res.send(blogAuthor);
    } else {
      next(createError(404, `Blog Author (${req.user._id}) not found`));
    }
  } catch (error) {
    next(error);
  }
  }
);






//select
//read
//get
blogAuthors.get("/",checkAuth,isAdmin, async (req, res, next) => {
  //localhost:3001/blogauthor?fields=name,surname
  console.log('found route')
  try {
    const query = q2m(req.query);
    console.log(query);
    if (!query.options.skip) query.options.skip = 0;
    if (!query.options.limit || query.options.limit > 10)
      query.options.limit = 20;
    const total = await blogAuthorsModel.countDocuments(query.criteria);
    const blogAuthors = await blogAuthorsModel
      .find(query.criteria, query.options.fields)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);
    res.send({
      links: query.links(`${process.env.FE_URL}/blogposts`, total),
      total,
      totalPages: Math.ceil(total / query.options.limit),
      blogAuthors,
    });
  } catch (error) {
    next(error);
  }
});
//select where
//read
//get
blogAuthors.get("/:id", async (req, res, next) => {
  //localhost:3001/blogauthor/6271767063696192aa9869f1/?fields=name,surname
  try {
    const query = q2m(req.query);
    const blogAuthor = await blogAuthorsModel.findById(
      req.params.id,
      query.options.fields
    );
    if (blogAuthor) {
      res.send(blogAuthor);
    } else {
      next(createError(404, `Blog Author (${req.params.id}) not found`));
    }
  } catch (error) {
    next(error);
  }
});
//update
//put
blogAuthors.put(
  "/:id",
  checkBlogAuthor,
  checkValidationResult,isAdmin,
  async (req, res, next) => {
    try {
      const blogAuthor = await blogAuthorsModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (blogAuthor) {
        res.send(blogAuthor);
      } else {
        next(createError(404, `Blog Author (${req.params.id}) not found`));
      }
    } catch (error) {
      next(error);
    }
  }
);
//delete
blogAuthors.delete("/:id",isAdmin, async (req, res, next) => {
  try {
    const blogAuthor = await blogAuthorsModel.findByIdAndDelete(req.params.id);
    if (blogAuthor) {
      res.status(204).send();
    } else {
      next(createError(404, `Blog Author (${req.params.userId}) not found`));
    }
  } catch (error) {
    next(error);
  }
});
//Avatar
blogAuthors.put("/:id/avatar/",isAdmin,upload('avatars'),  async (req,res, next) => {
  try {
    //localhost:3001/blogAuthor/6271767063696192aa9869f1/avatar

    const blogAuthor = await blogAuthorsModel.findByIdAndUpdate(
      req.params.id,
     {$set:{"avatar":req.file.path}},
      { new: true }
    );
    if (blogAuthor) {
      res.send(blogAuthor);
    } else {
      next(createError(404, `Blog Author (${req.params.id}) not found`));
    }
  } catch (error) {
    next(error);
  }
  }
);



export default blogAuthors;
