const mysql = require("mysql");
const util = require("util");
const logger = require("./logger")
const conf = require("../config.json")

const connection = mysql.createConnection(conf.sql);
const query = util.promisify(connection.query).bind(connection);

const safeQuery = async (res, val) => {
	try {
		res.json(await query(val));
	} catch(e) {
		logger.error("sql.safeQuery", "Error in query.");
		res.json({ error: "DB Error" });
	};
};

// https://stackoverflow.com/a/7760578
const clean = str => str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, char => {
    switch (char) {
        case "\0":
            return "\\0";
        case "\x08":
            return "\\b";
        case "\x09":
            return "\\t";
        case "\x1a":
            return "\\z";
        case "\n":
            return "\\n";
        case "\r":
            return "\\r";
        case "\"":
        case "'":
        case "\\":
        case "%":
            return "\\"+char;
        default:
            return char;
    }
});

connection.connect(async (err) => {
	if (err) throw err;
	logger.info("sql.connect", "SQL connected.");
});

module.exports = { query, safeQuery, clean };