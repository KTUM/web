import { comma } from "../modules/score.js";

new Vue({
    el: "#app",
    data() {
        return {
            options: {
                mode: "standard",
                relax: "vanilla",
                page: 0,
                sort: "pp",
                country: ""
            },

            ui: {
                endReached: true,
                disabled: {
                    mode: [],
                    rx: []
                }
            },

            users: []
        }
    },

    created() {
        this.UpdateLB();
    },

    methods: {
        comma,

        UpdateLB(page=0) {
            fetch(`/japi/rankings/users/${this.options.mode}/${this.options.relax}/${this.options.sort}?page=${this.options.page+page}&country=${this.options.country.toLowerCase()}`).then(o => o.json()).then(data => {
                if (!data.length && !this.ui.endReached) {
                    this.ui.endReached = true;
                    this.options.page += page;
                    
                    return;
                }
                
                this.ui.endReached = false;
                this.options.page += page;
                this.users = data;
            });
        },

        ChangePage(n) {
            if (this.options.page <= 0 && n == -1) return;

            this.UpdateLB(n);
        },

        ChangeMode(num, val="mode") {
            this.options[val] = num;
            this.options.page = 0;

            this.UpdateLB();
        },

        SelectedMode(n, mode="mode") {
            return this.options[mode] == n ? "active" : "";
        },

        isEnabledMode(m) {
            return [...this.ui.disabled.mode, ...this.ui.disabled.rx].includes(m);
        },

        page(i, len) { return (i+1)+(this.options.page*len) }
    },

    computed: {
        pageIsZero() {
            return this.options.page === 0;
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
        },

        "options.country"(newval) {
            this.options.page = 0;
            this.UpdateLB();
        }
    }
});