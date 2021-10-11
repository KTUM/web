const express = require("express");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const conf = require("./config.json");
const logger = require("./utils/logger");
const app = express();

app.set("view engine", "pug")
app.use("/", express.static(__dirname + "/public"));
app.use("/static", express.static(__dirname + "/static"));

app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: conf.server.secret,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/", require("./routes/frontend"));
app.use("/japi", require("./routes/api"));

app.use((req, res) => res.status(404).json({ error: "404 not found." }));
app.listen(conf.server.port, () => {
    logger.info(false, `${conf.name.toLowerCase()}-web has started`);
});