if(process.env.NODE_ENV != "production") {
  require("dotenv").config()
}

if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
//console.log('NODE_ENV=', process.env.NODE_ENV);
// console.log(process.env.SECRET);

const express = require("express");
const app = express();
const helmet = require("helmet");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://unpkg.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://res.cloudinary.com",
          "https://images.unsplash.com",
          "https://plus.unsplash.com",
          "https://tile.openstreetmap.org", // map tiles
          "https://unpkg.com",              // Leaflet's pin icon
        ],
        upgradeInsecureRequests: null,
      },
    },
    // Send the site's origin (not the full URL) to other sites, as OSM requires
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const connectMongo = require("connect-mongo");
const MongoStore = connectMongo.MongoStore || connectMongo.default || connectMongo;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStratergy = require("passport-local");
const User = require("./models/user.js");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const dbUrl = process.env.ATLASDB_URL;
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  next();
});

app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.locals.categories = require("./utils/categories.js");
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: MONGO_URL,
  crypto: {
    secret: "mysecretsupercode",
  },
  touchAfter: 24*3600,
});

store.on("error", ()=> {
  console.log("ERROR in MONGO SESSION STORE", err)
})

const sessionOptions = {
  store,
  secret: process.env.SECRET || "mysecretsupercode",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// General limiter for the whole site
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for login and signup attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many attempts, please try again after 15 minutes.",
});

app.use(generalLimiter);
app.post("/login", authLimiter);
app.post("/signup", authLimiter);

app.get("/", (req, res) => {
  // Logged-in users skip the cover page
  if (req.isAuthenticated()) {
    return res.redirect("/listings");
  }
  res.render("landing.ejs");
});

app.get("/privacy", (req, res) => {
  res.render("static/privacy.ejs");
});

app.get("/terms", (req, res) => {
  res.render("static/terms.ejs");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.use((req, res, next) => {
  next(new ExpressError(404, "Page not Found!"));
});

app.use((err, req, res, next) => {
  // An invalid ObjectId in the URL (like /listings/abc) just means "no such page"
  if (err.name === "CastError" && err.kind === "ObjectId") {
    err.statusCode = 404;
  }

  console.error(err.statusCode === 404 ? `404: ${req.method} ${req.originalUrl}` : err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  // In production, hide the details of unexpected (500) errors
  const message =
    isProd && statusCode === 500
      ? "Something went wrong"
      : err.message || "Something went wrong";

  if (statusCode === 404) {
    return res.status(404).render("404.ejs");
  }

  res.status(statusCode).render("error.ejs", { err: { message, statusCode } });
});

app.listen(8080, () => {
  console.log("app is listening to port 8080");
});
