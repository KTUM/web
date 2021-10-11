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

            page: {
                best: 0,
                recent: 0
            },

            ui: {
                disabled: {
                    mode: [],
                    rx: [],
                    load: []
                },

                dialog: {
                    toggle: false,
                    play: {}
                }
            }
        }
    },

    created() {
        this.loadAll();
    },

    methods: {
        comma, moment,

        launchDialog(play) {
            this.ui.dialog.play = play;

            this.ui.dialog.play["acc"] = `${this.ui.dialog.play["acc"].toString().replace(/%/g, "")}%`;
            this.ui.dialog.play["play_time"] = moment(this.ui.dialog.play["play_time"]).format("DD/MM/YYYY")+" (DD/MM/YY)"; 
            this.ui.dialog.play["score"] = comma(this.ui.dialog.play["score"]);
            this.ui.dialog.play["mods"] = convertMods(this.options.mode, this.ui.dialog.play["mods"]).join(", ") || "No mods!";
            this.ui.dialog.play["mode"] = ["Standard", "Taiko", "Catch the Beat", "Mania"][this.ui.dialog.play["mode"]];

            this.ui.dialog.play["userid"] = null;
            this.ui.dialog.play["scoreid"] = null;

            this.ui.dialog.toggle = true;
        },

        closeDialog() {
            this.ui.dialog.toggle = false;
        },

        formatDialog(name) {
            return name.replace("_", " ");
        },

        formatMods(mods) {
            return convertMods(this.options.mode, mods).map(i => 
                `/static/mods/${i.toLowerCase()}.png`    
            );
        },

        formatPP(pp) {
            return pp <= 0 ? "-" : Math.round(pp);
        },

        formatPerfect(perfect, miss) {
            return perfect ? "fc" :  (
                miss == 0 ? "sb" : miss+"x"
            );
        },

        async loadPlays(type) {
            const plays = await fetch(
                `/japi/users/scores/${type}/${this.options.mode}/${this.options.relax}/${USER_ID}`
            ).then(o => o.json());
            
            this.profile[type] = plays;
        },

        async loadMore(type) {
            const plays = await fetch(
                `/japi/users/scores/${type}/${this.options.mode}/${this.options.relax}/${USER_ID}?page=${++this.page[type]}`
            ).then(o => o.json());


            if (!plays.length) {
                this.ui.disabled.load.push(type);
                return;
            }
            
            this.profile[type] = [...this.profile[type], ...plays];
        },

        loadAll() {
            this.ui.disabled.load.length = 0;

            for (let o in this.page) {
                this.page[o] = 0;
            }

            for (let load of ["best", "recent", "most"])
                this.loadPlays(load);
        },

        ChangeMode(num, val="mode") {
            this.options[val] = num;
            this.loadAll();
        },

        SelectedMode(n, mode="mode") {
            return this.options[mode] == n ? "active" : "";
        },

        isEnabledMode(m) {
            return [...this.ui.disabled.mode, ...this.ui.disabled.rx].includes(m);
        },

        isEnabledButton(type) {
            return this.ui.disabled.load.includes(type);
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