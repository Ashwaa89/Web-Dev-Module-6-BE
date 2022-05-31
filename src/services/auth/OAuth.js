import GoogleStrategy from  "passport-google-oauth20"
import passport from "passport"
import fetch from "node-fetch"
import blogAuthorsModel from "../../services/blog/authors/model.js"
import { generateToken} from "./auth.js"
const GooglePassport = new GoogleStrategy(
    {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BE_URL}/blogAuthor/googleRedirect`
},
async (accessToken, refreshToken, profile, CB) => {
try {
    const blogAuthor = await blogAuthorsModel.findOne({ email: profile.emails[0].value })
   if(blogAuthor) {

    CB(null,{ accessToken: await generateToken({ _id: blogAuthor._id, role: blogAuthor.role }),name:blogAuthor.name })
 } else {
    const newBlogAuthor = {
        name: profile.name.givenName,
        surname:  profile.name.familyName,
        email:  profile.emails[0].value,
        avatar: profile.photos[0].value,
        googleId: profile.id,
    }
    let response = await fetch(`/blogAuthor/register`, {
        method: "POST",
        body: JSON.stringify(newBlogAuthor),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(response => response.json()).then(result => {
        CB(null, result) 
       });
 }
} catch (error) {
    console.log('autherror',error)
}


}
)
passport.serializeUser((data, passportNext) => {
    passportNext(null, data)
  })
export default GooglePassport