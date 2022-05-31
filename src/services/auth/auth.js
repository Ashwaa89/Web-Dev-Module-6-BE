import jwt from "jsonwebtoken"
import createError from "http-errors"

export const generateToken = payload =>
new Promise((resolve, reject) =>
jwt.sign(payload, process.env.AUTH_SECRET, { expiresIn: "1 week" }, (err, token) => {
if (err) reject(err)
else resolve(token)
})
)

export const verifyToken = token =>
new Promise((resolve, reject) =>
jwt.verify(token, process.env.AUTH_SECRET, (err, payload) => {
if (err) reject(err)
else resolve(payload)
})
)

export const checkAuth = async (req, res, next) => {
if (!req.headers.authorization) {
next(createError(401, "Bearer token missing"))
} else {
try {     
 //Example header: Authorization header ("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2Mjg2N2YwZDAyYjc0NGMyNzcwZTgwZGEiLCJpYXQiOjE2NTI5ODU5NTgsImV4cCI6MTY1MzU5MDc1OH0.oGDhjmQm_aL64YkDxNQOFeII_D8ugI3SHt0wUShnvjo")
const payload = await verifyToken(req.headers.authorization.replace("Bearer ", ""))
req.user = {
_id: payload._id,
role: payload.role,
name: payload.name,
}
next()
} catch (error) {
next(createError(401, "Invalid Token"))
}
}
}

export const isAdmin = async (req, res, next) => {
    if (req.user.role === "Admin") {
        next()
      } else {
        next(createError(403, "Not Authorised"))
      }
}