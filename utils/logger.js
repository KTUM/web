// Very basic logging lib that I use.
// I use this so I can easily disable annoying comments I don't
// need to see. 

const chalk = require("chalk");
const conf = require("../config.json");

const COLORS = {
    info_center: "red",
    info_normal: "cyan",

    log: "white",
    warn: "magenta",
    error: "red"
}

function GenerateNormal(type, funcName, message) {
    if (conf.server.prod != "development") return;

    const getTime = date => {
        return new Date().toLocaleTimeString();  
    }

    console.log(
        chalk.grey(`[${getTime(new Date(Date.now()))}] `) +
        chalk.yellow(`[${funcName}] `) +
        `${chalk[COLORS[type]](message)}`
    );
}

exports.info = (funcName, msg) => {
    if (!funcName) {
        console.log(
            chalk[COLORS.info_center](`${"=".repeat(5)} ${msg} ${"=".repeat(5)}\n`) +
            chalk.white(`> port: ${conf.server.port}\n`) +
            chalk.white(`> prod: ${conf.server.prod}\n`) +
            chalk.white(`> user: ${conf.sql.user}\n`)
        );

        return;
    }

    GenerateNormal("info_normal", funcName, msg);
}

exports.log = (funcName, msg) => GenerateNormal("log", funcName, msg);
exports.warn = (funcName, msg) => GenerateNormal("warn", funcName, msg);
exports.error = (funcName, msg) => GenerateNormal("error", funcName, msg);