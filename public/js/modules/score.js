/* 
    modules/score.js - general score calculation functions used everywhere.
*/

const comma = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const _loggedMods = {
    "standard": {
        "EZ": 2,
        "NF": 1,
        "HT": 256,

        "HR": 16,
        "SD": 32,
        "PF": 16384,
        "DT": 64,
        "NC": 512,
        "HD": 8,
        "FL": 1024,

        "RX": 128,
        "AP": 8192,
        "SO": 4096,
        "Auto": 0,
        "Cinema": 0,
        "ScoreV2": 0
    },

    "taiko": {
        "EZ": 2,
        "NF": 1,
        "HT": 256,

        "HR": 16,
        "SD": 32,
        "PF": 16384,
        "DT": 64,
        "NC": 512,
        "HD": 8,
        "FL": 1024,

        "RX": 128,
        "Auto": 0,
        "Cinema": 0,
        "ScoreV2": 0
    },

    "ctb": {
        "EZ": 2,
        "NF": 1,
        "HT": 256,

        "HR": 16,
        "SD": 32,
        "PF": 16384,
        "DT": 64,
        "NC": 512,
        "HD": 8,
        "FL": 1024,

        "RX": 128,
        "Auto": 0,
        "Cinema": 0,
        "ScoreV2": 0
    },

    "mania": {
        "EZ": 2,
        "NF": 1,
        "HT": 256,

        "HR": 16,
        "SD": 32,
        "PF": 16384,
        "DT": 64,
        "NC": 512,
        "FI": 1048576,
        "HD": 8,
        "FL": 1024,

        "K1": 0,
        "K2": 0,
        "K3": 0,
        "K4": 32768,
        "K5": 65536,
        "K6": 131072,
        "K7": 262144,
        "K8": 524288,
        "K9": 16777216,

        // CO OP Mods
        // "2P": 0,
        // "2K": 0,
        // "4K": 0,
        // "6K": 0,
        // "8K": 0,
        // "10K": 0,
        // "12K": 0,
        // "14K": 0,
        // "16K": 0,
        // "18K": 0,

        "MR": 1073741824,
        "RD": 0,
        "Auto": 0,
        "Cinema": 0,
        "ScoreV2": 0
    }
};

function convertMods(mode, n) {
    const playmods = [];
    const mods = JSON.parse(JSON.stringify(_loggedMods));

    if (n & mods[mode].NC) {
        playmods.push("NC");
        mods[mode].NC = 0;
        mods[mode].DT = 0;
    } else if (n & mods[mode].DT) {
        playmods.push("DT");
        mods[mode].NC = 0;
        mods[mode].DT = 0;
    };

    for (const mod of Object.keys(mods[mode])) {
        if (mods[mode][mod] != 0 && (n & mods[mode][mod])) {
            playmods.push(mod);
        };
    };

    return playmods;
}

function calculateLevel(n) {
    if (n > 100)
        return 26931190827 + 99999999999 * (n - 100);
    else
        return  5000 / 3 * ((4*(n**3))  - (3*(n**2)) - n) + 1.25 * 1.8**(n - 60);
}

export {
    comma, _loggedMods, convertMods, calculateLevel
}