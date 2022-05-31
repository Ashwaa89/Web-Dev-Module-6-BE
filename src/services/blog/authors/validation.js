import { checkSchema, validationResult } from "express-validator";
import createError from "http-errors";

const schema = {
  name: {
    in: ["body"],
    isString: {
      errorMessage: "Name is required and should be in string format",
    },
  },
  // password: {
  //   in: ["body"],
  //   isString: {
  //     errorMessage: "Password is required and should be in string format",
  //   },
  // },
  surname: {
    in: ["body"],
    isString: {
      errorMessage: "Surname is required and should be in string format",
    },
  },
  email: {
    in: ["body"],
    isString: {
      errorMessage: "Email is required and should be in string format",
    },
    isEmail: {
      errorMessage: "Incorrect email format",
    },
  },
  // dateOfBirth: {
  //   in: ["body"],
  //   isDate: {
  //     errorMessage: "Incorrect Date of Birth format",
  //   },
  // },
};
export const checkBlogAuthor = checkSchema(schema);
export const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error(errors)
    next(
      createError(400, "Validation problems in req.body", {
        errorsList: errors.array(),
      })
    );
  } else {
    next();
  }
};
