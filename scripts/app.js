
/*
* GAME GRAPH MAIN
* main application reference for initializing
* the graph
*/
var App = function ($canvas) {

  this._ps = null;
  this._renderer = new GameRenderer($canvas);
  this._api = new GameApi();
  this._currentLeaderboardPage = 0;
  this._loadingLeaderboardComplete = false;

  this._paused = false;
  
  this._players = [];
  this._effects = [];

  this.init();
}

App.constructor = App;
App.prototype = {

  /*
  * Handles setup and initialization for the app
  */  
  init: function () {
    // create the particle system
    this._ps = arbor.ParticleSystem(2000, 600, 0.5);
    this._ps.parameters({ gravity: true });

    // set the particle systems renderer to the same methods
    this._ps.renderer = { init: this._renderer.init.bind(this._renderer), redraw: this._renderer.redraw.bind(this._renderer) };

    // call to get the initial player list    
    this._api.getLeaderboard(this._currentLeaderboardPage, this.onGetLeaderboard.bind(this));

    // call the main loop    
    setInterval(this.loop.bind(this), 1000);
  },

  /*
  * Main app loop
  */  
  loop : function () {
    if (this._paused || !this._loadingLeaderboardComplete) return;
    this._api.getEffects(this.onGetEffects.bind(this));     
  },

  /*
  * Handle the return from requesting
  * leaderboard data.
  */  
  onGetLeaderboard: function (data) {
    // if no data, loading is complete
    if (!data || data.length == 0) {
      this._loadingLeaderboardComplete = true;
      return;
    };

    // map players    
    var players = _.map(data, this.mapLeaderboardDataToPlayer.bind(this));

    // join list
    this._players = _.union(this._players, players);

    // update page and make API call
    this._currentLeaderboardPage++;
    this._api.getLeaderboard(this._currentLeaderboardPage, this.onGetLeaderboard.bind(this));
  },

  /*
  * Maps API data to player object
  */  
  mapLeaderboardDataToPlayer: function (data) {
    var image = new Image();
    image.src = data.AvatarUrl;

    return {
      name: data.PlayerName,
      image: image,
      points: data.Points
    };
  },
  
  /*
  * Handle /effects API data. Draw connections
  * to other nodes
  */
  onGetEffects : function (data) {
    if (!data || data.length == 0) return;

    var creatorsDrawn = [];
    
    _.forEach(data, function (effect) {
      var isAttack = effect.Effect != null && effect.Effect.EffectType === "Attack";

      // make sure we don't do this for the same person multiple times      
      if (creatorsDrawn.indexOf(effect.Creator) > -1) return;
      creatorsDrawn.push(effect.Creator);

      // map the creator and targets to nodes      
      var creator = this.addGetNode(effect.Creator);
      var target = this.addGetNode(effect.Targets);

      // prune the creator edges;      
      var creatorEdges = this._ps.getEdgesFrom(creator);
      _.forEach(creatorEdges, function (edge) { this._ps.pruneEdge(edge); }.bind(this));

      // if the creator is not the target, draw the edge      
      if (creator.name != target.name)
        this._ps.addEdge(creator, target, { isAttack : isAttack });  
      
    }.bind(this));
  },

  /*
  * Handles safely getting a node regardless
  * of it existing or not. If it doesn't exist,
  * create it by finding the matching player;
  */  
  addGetNode: function (name) {
    var node = this._ps.getNode(name);
    if (node) return node;

    var playerMatch = _.find(this._players, { "name": name });
    if (!playerMatch) return;

    return this._ps.addNode(name, { points: playerMatch.points, image: playerMatch.image });
  }
}


// Lets start
$(function () {
  var app = new App($("#viewport"));
});