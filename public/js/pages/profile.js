import { comma, convertMods } from "../modules/score.js";

const USER_URL = location.href.split("/");
const USER_ID = USER_URL[USER_URL.length-1];

new Vue({
    el: "#app",
    data() {
        return {
            options: {
                mode: "taiko",
                relax: "vanilla"
            },

            profile: {
                best: {},
                recent: {}
            },

            ui: {
                disabled: {
                    mode: [],
                    rx: []
                }
            }
        }
    },

    created() {
        this.loadAll();
    },

    methods: {
        comma, moment,

        formatMods(mods) {
            return convertMods(this.options.mode, mods).map(i => 
                `/static/mods/${i.toLowerCase()}.png`    
            );
        },

        async loadPlays(type) {
            const plays = await fetch(
                `/japi/users/scores/${type}/${this.options.mode}/${this.options.relax}/${USER_ID}`
            ).then(o => o.json());
            
            this.profile[type] = plays;
        },

        loadAll() {
            for (let load of ["best", "recent", "most"])
                this.loadPlays(load);
        },

        ChangeMode(num, val="mode") {
            this.options[val] = num;

            console.log(num, val)

            this.loadAll();
        },

        SelectedMode(n, mode="mode") {
            return this.options[mode] == n ? "active" : "";
        },

        isEnabledMode(m) {
            return [...this.ui.disabled.mode, ...this.ui.disabled.rx].includes(m);
        }
    },


    watch: {
        "options.mode"(newval) {
            switch (newval) {
                case "standard":
                    this.ui.disabled.mode = [];
                    break;
                case "taiko":
                case "catch":
                    this.ui.disabled.mode = ["autopilot"];
                    break;
                case "mania":
                    this.ui.disabled.mode = ["relax", "autopilot"];
                    break;
            }
        },

        "options.relax"(newval) {
            switch (newval) {
                case "vanilla":
                    this.ui.disabled.rx = [];
                    break;
                case "relax":
                    this.ui.disabled.rx = ["mania"];
                    break;
                case "autopilot":
                    this.ui.disabled.rx = ["taiko", "catch", "mania"];
                    break;
            }
        }
    }
});


// /beatmaps/1395111/covers/cover.jpg