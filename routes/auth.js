const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const sql = require("../utils/sql");
const logger = require("../utils/logger");

async function authUser(email, password, done) {
    const user = await sql.query(`SELECT * FROM users WHERE email = '${sql.clean(email)}'`);
    
    if (!user.length) {
        return done(null, false, {
            message: "No user with that email."
        });
    }

    if (await bcrypt.compare(
        new Buffer.from(crypto.createHash("md5").update(new Buffer.from(password, "utf-8")).digest("hex"), "utf-8"),
        user[0].pw_bcrypt
    )) {
        logger.log("authUser", `${user[0].name} is logging in.`);
        return done(null, user[0]);
    }

    return done(null, false, { message: "Invalid password." });
}

exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect("/login");
}

exports.isntAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }

    res.redirect("/");
}

passport.use(new localStrategy({
    usernameField: "email"
}, authUser));

passport.serializeUser((user, done) => {
    return done(null, user.id);
});

passport.deserializeUser(async (ID, done) => {
    const user = await sql.query(`
        SELECT
            id, name, email,
            priv, country, silence_end,
            donor_end, latest_activity,
            clan_id, clan_priv 
        FROM users 
        WHERE id = ${ID};
    `);

    if (!user.length) {
        logger.error("passport.deserializeUser", `${ID} is not a valid user!`);
        return;
    };

    return done(null, user[0]);
});