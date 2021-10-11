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

global.grabUserData = async (req, res) => {
	const ip = req.headers["x-forwarded-for"]?.split(",").shift() || req.socket?.remoteAddress
	const userid = parseInt(req.params.id);
	
	if (!Number.isInteger(parseInt(userid))) {
        logger.warn("users general id", `${ip} is asking for an invalid id, ${JSON.stringify(req.params)}.`);

		res.status(400);
		res.json({error: "400, bad request!"});
		return;
	}

	const check = await sql.query(`SELECT priv FROM users WHERE id = ${userid}`);
	if (!check.length) {
		res.status(401);
		res.json({error: "404, user not found."});
		
		return;
	} else if (!(check[0].priv >= 3)) {
		res.status(401);
		res.json({error: "401, user is either not verified or restricted."});
		
		return;
	}

	const data = await sql.query(`
		SELECT 
			users.id, users.name,
			users.safe_name, users.priv,
			users.country, users.silence_end,
			users.donor_end, users.creation_time,
			users.latest_activity, users.clan_id,
			user_custom.bio, user_custom.favmod,
			user_custom.favmode, user_custom.playstyle
		FROM users
		INNER JOIN user_custom
		ON users.id = user_custom.userid
		WHERE users.id = ${userid}
	`);

	return data[0];
}

router.get("/users/general/:id", async (req, res) => {
	res.json(await grabUserData(req, res));
});

router.get("/users/stats/:mode/:rx/:id", async (req, res) => {
	const ip = req.headers["x-forwarded-for"]?.split(",").shift() || req.socket?.remoteAddress
	const userid = parseInt(req.params.id);
	
	const mode = {
		"standard": consts.db.stats.vn_std,
		"taiko": consts.db.stats.vn_taiko,
		"catch": consts.db.stats.vn_catch,
		"mania": consts.db.stats.vn_mania
	}[req.params.mode];

	const rx = {
		"vanilla": 0,
		"relax": 4,
		"autopilot": 7
	}[req.params.rx];

	const parsedMode = mode+rx;
	if (
		[rx, mode].includes(undefined) ||
		parsedMode > 7 || !Number.isInteger(parseInt(userid))
	) {
        logger.warn("user scores", `${ip} is sending invalid data ${JSON.stringify(req.params)}, ${JSON.stringify(req.query)}.`);

		res.status(400);
		res.json({error: "400, bad request!"});
		return;
	}

	const check = await sql.query(`SELECT priv FROM users WHERE id = ${userid}`);
	if (!check.length) {
		res.status(401);
		res.json({error: "404, user not found."});
		
		return;
	} else if (!(check[0].priv >= 3)) {
		res.status(401);
		res.json({error: "401, user is either not verified or restricted."});
		
		return;
	}

	await sql.safeQuery(res, `
		SELECT * FROM stats WHERE id = ${userid} AND mode = ${parsedMode} 
	`);
});

router.get("/users/scores/:type/:mode/:rx/:id", async (req, res) => {
	const ip = req.headers["x-forwarded-for"]?.split(",").shift() || req.socket?.remoteAddress
	const [userid, page] = [parseInt(req.params.id) || 0, parseInt(req.query.page) || 0];
	
	const mode = {
		"standard": consts.db.stats.vn_std,
		"taiko": consts.db.stats.vn_taiko,
		"catch": consts.db.stats.vn_catch,
		"mania": consts.db.stats.vn_mania
	}[req.params.mode];

	const mode_db = {
		"standard": 0,
		"taiko": 1,
		"catch": 2,
		"mania": 3,
	}[req.params.mode];

	const rx = {
		"vanilla": 0,
		"relax": 4,
		"autopilot": 7
	}[req.params.rx];

	const rx_db = {
		"vanilla": "vn",
		"relax": "rx",
		"autopilot": "ap"
	}[req.params.rx];

	const parsedMode = mode+rx;
	if (
		[rx, mode].includes(undefined) ||
		parsedMode > 7 || page < 0 ||
		!Number.isInteger(parseInt(userid))
	) {
        logger.warn("user scores", `${ip} is sending invalid data ${JSON.stringify(req.params)}, ${JSON.stringify(req.query)}.`);

		res.status(400);
		res.json({error: "400, bad request!"});
		return;
	}

	const check = await sql.query(`SELECT priv FROM users WHERE id = ${userid}`);
	if (!check.length) {
		res.status(401);
		res.json({error: "404, user not found."});
		
		return;
	} else if (!(check[0].priv >= 3)) {
		res.status(401);
		res.json({error: "401, user is either not verified or restricted."});
		
		return;
	}

	switch (req.params.type) {
		case "recent":
			await sql.safeQuery(res, `
				SELECT
					scores_${rx_db}.id AS scoreid, scores_${rx_db}.map_md5,
					scores_${rx_db}.score, scores_${rx_db}.pp,
					scores_${rx_db}.acc, scores_${rx_db}.max_combo,
					scores_${rx_db}.mods, scores_${rx_db}.n300,
					scores_${rx_db}.n100, scores_${rx_db}.n50,
					scores_${rx_db}.nmiss, scores_${rx_db}.ngeki,
					scores_${rx_db}.nkatu, scores_${rx_db}.grade,
					scores_${rx_db}.status, scores_${rx_db}.mode,
					scores_${rx_db}.play_time, scores_${rx_db}.time_elapsed,
					scores_${rx_db}.userid, scores_${rx_db}.perfect,
					maps.id as bmapid, maps.set_id,
					maps.creator, maps.artist,
					maps.title, maps.version
				FROM scores_${rx_db}
				
				INNER JOIN users
				ON scores_${rx_db}.userid = users.id
				INNER JOIN maps
				ON maps.md5 = scores_${rx_db}.map_md5

				WHERE users.id = ${userid} AND scores_${rx_db}.mode = ${mode_db}
				LIMIT ${page*global.conf.general.lb_lengths}, ${global.conf.general.lb_lengths}
			`); break;
		case "best":
			await sql.safeQuery(res, `
				SELECT
					scores_${rx_db}.id AS scoreid, scores_${rx_db}.map_md5,
					scores_${rx_db}.score, scores_${rx_db}.pp,
					scores_${rx_db}.acc, scores_${rx_db}.max_combo,
					scores_${rx_db}.mods, scores_${rx_db}.n300,
					scores_${rx_db}.n100, scores_${rx_db}.n50,
					scores_${rx_db}.nmiss, scores_${rx_db}.ngeki,
					scores_${rx_db}.nkatu, scores_${rx_db}.grade,
					scores_${rx_db}.status, scores_${rx_db}.mode,
					scores_${rx_db}.play_time, scores_${rx_db}.time_elapsed,
					scores_${rx_db}.userid, scores_${rx_db}.perfect,
					maps.id as bmapid, maps.set_id,
					maps.creator, maps.artist,
					maps.title, maps.version
				FROM scores_${rx_db}
				
				INNER JOIN users
				ON scores_${rx_db}.userid = users.id
				INNER JOIN maps
				ON maps.md5 = scores_${rx_db}.map_md5

				WHERE users.id = ${userid} AND scores_${rx_db}.grade != "F" AND scores_${rx_db}.mode = ${mode_db}
				ORDER BY scores_${rx_db}.pp DESC
				LIMIT ${page*global.conf.general.lb_lengths}, ${global.conf.general.lb_lengths}
			`); break;
		case "recent_clean": // recent scores except no failed scores.
			await sql.safeQuery(res, `
				SELECT
					scores_${rx_db}.id AS scoreid, scores_${rx_db}.map_md5,
					scores_${rx_db}.score, scores_${rx_db}.pp,
					scores_${rx_db}.acc, scores_${rx_db}.max_combo,
					scores_${rx_db}.mods, scores_${rx_db}.n300,
					scores_${rx_db}.n100, scores_${rx_db}.n50,
					scores_${rx_db}.nmiss, scores_${rx_db}.ngeki,
					scores_${rx_db}.nkatu, scores_${rx_db}.grade,
					scores_${rx_db}.status, scores_${rx_db}.mode,
					scores_${rx_db}.play_time, scores_${rx_db}.time_elapsed,
					scores_${rx_db}.userid, scores_${rx_db}.perfect,
					maps.id as bmapid, maps.set_id,
					maps.creator, maps.artist,
					maps.title, maps.version
				FROM scores_${rx_db}
				
				INNER JOIN users
				ON scores_${rx_db}.userid = users.id
				INNER JOIN maps
				ON maps.md5 = scores_${rx_db}.map_md5

				WHERE users.id = ${userid} AND scores_${rx_db}.mode = ${mode_db} AND scores_${rx_db}.grade != "F"
				LIMIT ${page*global.conf.general.lb_lengths}, ${global.conf.general.lb_lengths}
			`); break;
		case "most":
			await sql.safeQuery(res, `
				SELECT
					maps.id AS bmapid,
					maps.set_id, maps.creator,
					maps.artist, maps.title,
					maps.version, map_md5,
					COUNT(*) AS playcount
				FROM scores_${rx_db}
				
				INNER JOIN maps
				ON maps.md5 = map_md5
				
				WHERE userid = 16
				GROUP BY map_md5
				ORDER BY playcount DESC

				LIMIT ${page*global.conf.general.lb_lengths}, ${global.conf.general.lb_lengths}
		`); break;
	}

});

router.get("/rankings/users/:mode/:rx/:sort", async (req, res) => {
	const ip = req.headers["x-forwarded-for"]?.split(",").shift() || req.socket?.remoteAddress
	const mode = {
		"standard": consts.db.stats.vn_std,
		"taiko": consts.db.stats.vn_taiko,
		"catch": consts.db.stats.vn_catch,
		"mania": consts.db.stats.vn_mania
	}[req.params.mode];

	const rx = {
		"vanilla": 0,
		"relax": 4,
		"autopilot": 7
	}[req.params.rx];

	const {country, page} = req.query;
	const sort = req.params.sort == "pp" ? "ORDER BY stats.pp DESC, stats.tscore DESC" : "ORDER BY stats.tscore DESC, stats.pp DESC";
	const parsedMode = mode+rx;
	
	if (
		[rx, mode].includes(undefined) ||
		parsedMode > 7 || !["pp", "score"].includes(req.params.sort) ||
		(country && country?.length != 2) ||
		(page !== undefined && !Number.isInteger(parseInt(page))) ||
		page < 0
	) {
        logger.warn("ranking global", `${ip} is sending invalid data ${JSON.stringify(req.params)}, ${JSON.stringify(req.query)}.`);

		res.status(400);
		res.json({error: "400, bad request!"});
		return;
	}

	await sql.safeQuery(res, `
		SELECT
			users.id, stats.pp, 
			stats.tscore, stats.rscore,
			stats.plays, stats.playtime,
			stats.acc, stats.max_combo,
			stats.xh_count, stats.x_count,
			stats.sh_count, stats.s_count,
			stats.a_count, users.name,
			stats.pp_4k, stats.pp_7k,
			users.clan_id, users.clan_priv,
			users.country
		FROM stats
		INNER JOIN users
		ON stats.id = users.id
		WHERE users.priv >= 3 AND mode = ${parsedMode} AND stats.tscore > 0
		${country ? `AND country = '${sql.clean(country)}'` : ""}
		${sort}
		LIMIT ${(page || 0)*global.conf.general.lb_lengths}, ${global.conf.general.lb_lengths}
	`);
});

module.exports = router;