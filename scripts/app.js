
/*
*
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
  *
  */  
  init: function () {
    this._ps = arbor.ParticleSystem(2000, 600, 0.5);
    this._ps.parameters({ gravity: true });
    this._ps.renderer = { init: this._renderer.init.bind(this._renderer), redraw: this._renderer.redraw.bind(this._renderer) };

    // call to get the initial player list    
    this._api.getLeaderboard(this._currentLeaderboardPage, this.onGetLeaderboard.bind(this));

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
  onGetLeaderboard : function (data) {
    if (!data || data.length == 0) {
      this._loadingLeaderboardComplete = true;
      return;
    };

    // map players    
    var players = _.map(data, function (d) {
      var image = new Image();
      image.src = d.AvatarUrl;

      return {
        name: d.PlayerName,
        image: image,
        points: d.Points
      };
    });

    // join list
    this._players = _.union(this._players, players);

    // update page and make API call
    this._currentLeaderboardPage++;
    this._api.getLeaderboard(this._currentLeaderboardPage, this.onGetLeaderboard.bind(this));
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

      if (creatorsDrawn.indexOf(effect.Creator) > -1) return;
      creatorsDrawn.push(effect.Creator);

      var creator = this.addGetNode(effect.Creator);
      var target = this.addGetNode(effect.Targets);

      // prune the creator edges;      
      var creatorEdges = this._ps.getEdgesFrom(creator);
      _.forEach(creatorEdges, function (edge) { this._ps.pruneEdge(edge); }.bind(this));

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

$(function () {
  var app = new App($("#viewport"));
});