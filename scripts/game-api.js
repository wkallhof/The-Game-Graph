URL = {
    LEADERBOARD: "http://thegame.nerderylabs.com:1337",
    EFFECTS: "http://thegame.nerderylabs.com:1337/effects"
}

/*
*
*/
var GameApi = function () { }

GameApi.constructor = GameApi;
GameApi.prototype = {

    /*
    *
    */
    getLeaderboard: function (page, callback) {
        this.makeRequest(URL.LEADERBOARD + "?page="+page)
            .done(callback)
            .fail(function () { console.log("Error getting leaderboard.") });
    },

    /*
    *
    */    
    getEffects: function (callback) {
        this.makeRequest(URL.EFFECTS)
            .done(callback)
            .fail(function () { console.log("Error getting leaderboard.") });
    },

    /*
    *
    */    
    makeRequest: function (url, callback) {
        console.log("Request made to : " + url);
        return $.get(url);
    }
};