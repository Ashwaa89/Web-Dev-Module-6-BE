import express from "express";
import createError from "http-errors";
import blogPostModel from "./model.js";
import { checkBlogPost, checkValidationResult } from "./validation.js";
import q2m from "query-to-mongo";
import { upload } from "../../image/imageupload.js";
import { sendEmail } from "../../email/sendemail.js";

import { generateToken,checkAuth,isAdmin } from "../../auth/auth.js"
const blogPosts = express.Router();


//insert
//create
//post
blogPosts.post(
  "/",checkAuth,
  checkBlogPost,
  checkValidationResult,
  async (req, res, next) => {
    try {
      const newblogPost = new blogPostModel(req.body);
      const savedblogPost = await newblogPost.save();
      // To: savedblogPost.author.email
      sendEmail(
        process.env.FROM_ADDRESS,
        "Post Submitted",
        `Your blog post ${savedblogPost.title} has been successfully posted`,
        `<h4>Thank you ${savedblogPost.author.name}</h4>`
      );
      res.send(savedblogPost);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

//select
//read
//get
blogPosts.get("/", async (req, res, next) => {
  try {
    //localhost:3001/blogposts?category=category&limit=2&fields=cover,title
    const query = q2m(req.query);
    if (!query.options.skip) query.options.skip = 0;
    if (!query.options.limit || query.options.limit > 10)
      query.options.limit = 20;
    const total = await blogPostModel.countDocuments(query.criteria);
    const blogPosts = await blogPostModel
      .find(query.criteria, query.options.fields)
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort)
      .populate({ path: "author" });
    res.send({
      links: query.links(`/`, total),
      total,
      totalPages: Math.ceil(total / query.options.limit),
      blogPosts,
    });
  } catch (error) {
    next(error);
  }
});

//select where
//read
//get
blogPosts.get("/:id", async (req, res, next) => {
  //localhost:3001/blogposts/62743ef73c93c8f345d5b84d/?fields=cover,title
console.log(req.params.id)

  try {
    const blogPost = await blogPostModel
      .findById({ _id: req.params.id }, q2m(req.query).options.fields)
      .populate({ path: "author" });
    if (blogPost) {
      res.send(blogPost);
    } else {
      next(createError(404, `Blog post (${req.params.id}) not found`));
    }
  } catch (error) {
    next(error);
  }
});

//update
//put
blogPosts.put(
  "/:id",checkAuth,isAdmin,
  checkBlogPost,
  checkValidationResult,
  async (req, res, next) => {
    try {
      const blogPost = await blogPostModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (blogPost) {
        res.send(blogPost);
      } else {
        next(createError(404, `Blog post (${req.params.userId}) not found`));
      }
      res.send(blogPost);
    } catch (error) {
      next(error);
    }
  }
);

//delete
blogPosts.delete("/:id",checkAuth,isAdmin, async (req, res, next) => {
  try {
    const blogPost = await blogPostModel.findByIdAndDelete(req.params.id);
    if (blogPost) {
      res.status(204).send();
    } else {
      next(createError(404, `Blog post (${req.params.userId}) not found`));
    }
  } catch (error) {
    next(error);
  }
});

//Comments:
//post comment
blogPosts.post("/:id/comments",checkAuth,isAdmin, async (req, res, next) => {
  try {
    //localhost:3001/blogposts/6279aaadc42b7da27af601dd/comments
    const blogPost = await blogPostModel.findById(
      { _id: req.params.id },
      { _id: 0 }
    );
    if (blogPost) {
      const newComment = req.body.comment;
      const updatedBlogPost = await blogPostModel.findByIdAndUpdate(
        req.params.id,
        { $push: { comments: newComment } },
        { new: true }
      );
      res.send(updatedBlogPost);
    } else {
      next(createError(404, `Blog post (${req.params.id}) not found`));
    }
  } catch (error) {
    next(error);
  }
});

//Get All Comments
blogPosts.get("/:id/comments", async (req, res, next) => {
  try {
    //localhost:3001/blogposts/6279aaadc42b7da27af601dd/comments
    const blogPost = await blogPostModel.findById({ _id: req.params.id });
    if (blogPost) {
      res.send(blogPost.comments);
    } else {
      next(createError(404, `Blog post (${req.params.id}) not found`));
    }
  } catch (error) {
    next(error);
  }
});

//Get Specific Comment
blogPosts.get("/:id/comments/:commentId", async (req, res, next) => {
  try {
    //localhost:3001/blogposts/6279aaadc42b7da27af601dd/comments/627d67334e1a066a23b8da9a
    const blogPost = await blogPostModel.findById({ _id: req.params.id });
    if (blogPost) {
      const comment = blogPost.comments.find(
        (comment) => comment._id.toString() === req.params.commentId
      );
      if (comment) {
        res.send(comment);
      } else {
        next(
          createError(404, `Comment with id ${req.params.commentId} not found`)
        );
      }
    } else {
      next(createError(404, `Blog post (${req.params.id}) not found`));
    }
  } catch (error) {
    next(error);
  }
});

//Edit Comment
blogPosts.put("/:id/comments/:commentId",checkAuth,isAdmin, async (req, res, next) => {
  try {
    //localhost:3001/blogposts/6279aaadc42b7da27af601dd/comments/627d6a296efad51722368dba
    const blogPost = await blogPostModel.findById({ _id: req.params.id });
    if (blogPost) {
      const commentIndex = blogPost.comments.findIndex(
        (comment) => comment._id.toString() === req.params.commentId
      );
      if (commentIndex !== -1) {
        const prevComment = blogPost.comments[commentIndex].toObject();
        blogPost.comments[commentIndex] = {
          ...prevComment,
          ...req.body.comment,
        };
        await blogPost.save();
        res.send(blogPost);
      } else {
        next(
          createError(404, `Comment with id ${req.params.commentId} not found`)
        );
      }
    } else {
      next(createError(404, `Blog post (${req.params.id}) not found`));
    }
  } catch (error) {
    next(error);
  }
});

//Delete Comment
blogPosts.delete("/:id/comments/:commentId",checkAuth,isAdmin, async (req, res, next) => {
  try {
    //localhost:3001/blogposts/6279aaadc42b7da27af601dd/comments/627d67334e1a066a23b8da9a
    const blogPost = await blogPostModel.findByIdAndUpdate(
      req.params.id,
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true }
    );
    if (blogPost) {
      res.send(blogPost);
    } else {
      next(createError(404, `Blog post (${req.params.id}) not found`));
    }
  } catch (error) {
    next(error);
  }
});

//Cover
blogPosts.put("/:id/cover/",checkAuth,isAdmin, upload("covers"), async (req, res, next) => {
  try {
    //localhost:3001/blogPosts/62743ef73c93c8f345d5b84d/cover
    const blogPost = await blogPostModel.findByIdAndUpdate(
      req.params.id,
      { $set: { cover: req.file.path } },
      { new: true }
    );
    if (blogPost) {
      res.send(blogPost);
    } else {
      next(createError(404, `Blog post (${req.params.id}) not found`));
    }
  } catch (error) {
    next(error);
  }
});

export default blogPosts;
