const express = require("express");
const passport = require("passport");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const sql = require("../utils/sql");
const logger = require("../utils/logger");
const conf = require("../config");
const auth = require("./auth");
const consts = require("../consts");
const router = express.Router();

router.get("/dash", auth.isAuthenticated, (req, res) => {
    if (!req.user) {
        res.status(401);
        res.json({error: "Invalid body received!"})
        return;
    }

    if (req.user.priv == consts.db.user.unverified) {
        return res.redirect("/verify");
    }

    res.render("index", {
        pageTitle: "Dashboard",
        user: req.user
    });
});


router.get("/verify", auth.isAuthenticated, async (req, res) => {
    const status = await sql.query(`SELECT priv FROM users WHERE id = ${parseInt(req.user.id)}`);

    if (status[0].priv == 1) {
        res.render("verify", {
            pageTitle: "Verify your account!",
            user: req.user,
            status
        });

        return;
    };

    res.redirect("/dash");
});


router.get("/login", auth.isntAuthenticated, (req, res) => {
    res.render("login", {
        pageTitle: "Login"
    });
});


router.get("/register", auth.isntAuthenticated, (req, res) => {
    res.render("register", {
        pageTitle: "Register"
    });
});


router.post("/login", auth.isntAuthenticated, passport.authenticate("local", {
    successRedirect: "/dash",
    failureRedirect: "/login",
    failureFlash: true
}));

router.post("/register", async (req, res) => {

    // NO LOCATION YET

    // Username requirements:
    //   not contain " " and "_" but one is fine?? (what the fuck)
    //   not be taken
    //   not share an email
    //   pass the regex
    const {name: username, email, password} = req.body;

    const ip = req.headers["x-forwarded-for"]?.split(",").shift() || req.socket?.remoteAddress
    const regex_username = /^[\w \[\]-]{2,15}$/g
    const regex_email = /^[^@\s]{1,200}@[^@\s\.]{1,30}\.[^@\.\s]{1,24}$/g

    const userslist = await sql.query(`SELECT 1 FROM users WHERE name = '${sql.clean(username)}'`);
    const emaillist = await sql.query(`SELECT 1 FROM users WHERE email = '${sql.clean(email)}'`);

    // TODO: Flash
    if (!username || !email || !password) {
        logger.warn("register post", `${ip} tried to register with empty params.`);
        return res.redirect("/");
    }

    if (username.includes("_") && username.includes(" ")) {
        logger.warn("register post", `${ip} tried to sign up with an invalid username.`);
        return res.redirect("/");
    }

    if (userslist.length || emaillist.length) {
        logger.warn("register post", `${ip} tried to sign up with an existing email/username ${emaillist}, ${userslist}.`);
        return res.redirect("/");
    }

    if (!regex_username.test(username) || !regex_email.test(email)) {
        logger.warn("register post", `${ip} has an invalid email or username. ${username}, ${email}`);
        return res.redirect("/");
    }

    const country = "xx";
    const name_safe = username.toLowerCase().replace(/ /g, "_");
    const passmd5 = new Buffer.from(crypto.createHash("md5").update(new Buffer.from(password, "utf-8")).digest("hex"), "utf-8")

    bcrypt.hash(passmd5, 12, async (err, hash) => {
        await sql.query(`
            INSERT INTO users
                (name, safe_name, email, pw_bcrypt, country, creation_time, latest_activity)
            VALUES
            ('${username}', '${name_safe}', '${email}', '${hash}', '${country}', UNIX_TIMESTAMP(), UNIX_TIMESTAMP())  
        `);

        // Add stats and custom
        const id = await sql.query(`SELECT id FROM users ORDER BY id DESC LIMIT 1`);

        for (let i = 0; i <= 7; i++) {
            await sql.query(`
                INSERT INTO stats
                (id, mode) VALUES (${id[0].id}, ${i})
            `);
        }

        await sql.query(`
            INSERT INTO user_custom
                (userid, bio, favmod, favmode, playstyle)
            VALUES 
                (${id[0].id}, '', 0, 0, 'Keyboard')
        `);
    });

    res.redirect("/login");
});

router.get("/profile/:id", async (req, res) => {
    const user = await grabUserData(req, res);

    if (user) {
        res.render("profile", {
            pageTitle: "User Page",
            userData: user
        });
    }
});

router.get("/rankings/users", (req, res) => {
    res.render("lb_user", {
        pageTitle: "Player rankings"
    });
});


router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/login");
});


module.exports = router;