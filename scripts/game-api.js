URL = {
    LEADERBOARD: "http://thegame.nerderylabs.com:1337",
    EFFECTS: "http://thegame.nerderylabs.com:1337/effects"
}

/*
* GAME API
* handles all API related functionality for getting
* The Game data
*/
var GameApi = function () { }

GameApi.constructor = GameApi;
GameApi.prototype = {

    /*
    * Get the leaderboard data
    * @param page : page number of data
    * @param callback : method to call upon success
    */
    getLeaderboard: function (page, callback) {
        this.makeRequest(URL.LEADERBOARD + "?page="+page)
            .done(callback)
            .fail(function () { console.log("Error getting leaderboard.") });
    },

    /*
    * Get the Effects data
    * @param callback : method to call upon success
    */    
    getEffects: function (callback) {
        this.makeRequest(URL.EFFECTS)
            .done(callback)
            .fail(function () { console.log("Error getting leaderboard.") });
    },

    /*
    * Handles making the actual request to the API
    * @param url : URL of the API request
    */    
    makeRequest: function (url) {
        //console.log("Request made to : " + url);
        return $.get(url);
    }
};