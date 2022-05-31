export const errorHandler = (err, req, res, next) => {
  switch (err.status) {
    case 400:
      res
        .status(400)
        .send({ message: err.message, errorsList: err.errorsList });
      break;
    case 401:
      res
        .status(401)
        .send({ message: err.message, errorsList: err.errorsList });
      break;
    case 403:
      res
        .status(403)
        .send({ message: err.message, errorsList: err.errorsList });
      break;
    case 404:
      res
        .status(404)
        .send({ message: err.message, errorsList: err.errorsList });
      break;
    default:
      res.status(500).send({
        error: "We had an error on our side! We gonna fix that asap!",
      });
  }
};
