
REN = {
    NODE_WIDTH: 50,
    MOUSE_DISTANCE: 20,
    BACKGROUND_COLOR: "rgb(43,62,80)",
    ATTACK_EDGE_COLOR: "rgba(273,83,79, .9)",
    GAIN_EDGE_COLOR: "rgba(92,184,92, .9)",
    PROFILE_CIRCLE_COLOR: "rgb(78,93,108)",
    FONT_COLOR: "white",
    FONT_STYLE: "20px Arial",
}

/*
* GAME RENDERER
* Draws the game graph
*/
var GameRenderer = function ($canvas) {
    this._canvas = $canvas.get(0);
    this._$canvas = $canvas;
    this._ctx = this._canvas.getContext("2d");
    this._ps = null;
    
    this._currentNodeFocus = null;

    this._scores = [];
}

GameRenderer.constructor = GameRenderer;
GameRenderer.prototype = {

    /*
    * Init method called by the particle system
    * @param system : Particle System passed in
    */
    init: function (system) {
        this._ps = system

        // handle window resize  
        $(window).resize(this.onResize.bind(this));
        // handle mouse move
        this._$canvas.mousemove(this.onMouseMove.bind(this));
        // call resize initially
        this.onResize();
    },

    /*
    * Handle the mousemove event from the canvas
    */    
    onMouseMove: function (e) {
        var offset = this._$canvas.offset();
        var mousePosition = arbor.Point(e.pageX - offset.left, e.pageY - offset.top)
        
        // find the nearest node to the mouse
        var nearest = this._ps.nearest(mousePosition);

        // if it doesn't exist or its not within 20 pixels, clear
        // current item        
        if (!nearest || !nearest.node || nearest.distance > REN.MOUSE_DISTANCE) {
            this._currentNodeFocus = null;
            return;
        }

        // set the nearest node to the current node        
        this._currentNodeFocus = nearest.node;
    },

    /*
    * Handles when the window is resized. Sets the canvas
    * widths for re-rendering
    */    
    onResize: function () {
        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
        this._ps.screenSize(this._canvas.width, this._canvas.height)
    },

    /*
    * Loop Draw method called for each animation frame.
    * Called by the particle system
    */    
    redraw: function () {
        // clear
        this._ctx.fillStyle = REN.BACKGROUND_COLOR;
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height)

        TWEEN.update();
        
        // draw 
        this._ps.eachNode(this.drawNode.bind(this));       
        this._ps.eachEdge(this.drawEdge.bind(this));
        this.drawName(this._currentNodeFocus);
        this.drawScoreItems();
    },

    /*
    * Handles drawing each edge in the graph
    */ 
    drawEdge: function (edge, pt1, pt2) {
        var isAttack = edge.data.isAttack;

        this._ctx.strokeStyle = isAttack ? REN.ATTACK_EDGE_COLOR : REN.GAIN_EDGE_COLOR;

        this._ctx.lineWidth = 2;
        this._ctx.beginPath();
        this._ctx.moveTo(pt1.x, pt1.y);
        this._ctx.lineTo(pt2.x, pt2.y);
        this._ctx.stroke();

        // draw arrow head        
        var endRadians = Math.atan((pt2.y-pt1.y)/(pt2.x-pt1.x));
        endRadians+=( (pt2.x > pt1.x) ? 90 :- 90 ) * Math.PI / 180;
        this.drawArrowHead(this._ctx, pt2.x, pt2.y, endRadians);
    },

    /*
    * Handles drawing each node in the graph
    */    
    drawNode: function (node, pt) {
        var w = REN.NODE_WIDTH;

        // draw image
        this._ctx.drawImage(node.data.image, pt.x - w / 2, pt.y - w / 2, w, w);

        // draw circle on image
        this._ctx.lineWidth = 11;
        this._ctx.strokeStyle = REN.PROFILE_CIRCLE_COLOR;
        this._ctx.beginPath();
        this._ctx.arc(pt.x, pt.y, 30, 0, 2*Math.PI);
        this._ctx.stroke();

        // draw position
        this._ctx.fillStyle = REN.FONT_COLOR;
        this._ctx.strokeStyle = "black";
        this._ctx.lineWidth = 2;
        this._ctx.font = REN.FONT_STYLE;
        this._ctx.strokeText(node.data.rank, pt.x - w / 2, pt.y + w / 2);
        this._ctx.fillText(node.data.rank, pt.x - w / 2, pt.y + w / 2);
    },

    /*
    * Draw the name for the node closest to the user's
    * mouse
    */    
    drawName: function (node) {
        if (!node) return;

        var w = REN.NODE_WIDTH;        
        var pt = this._ps.toScreen(node.p);
        
        this._ctx.fillStyle = REN.FONT_COLOR;
        this._ctx.font = REN.FONT_STYLE;
        this._ctx.fillText(node.name, pt.x - w / 2, pt.y + w );
    },

    /*
    * Handles drawing the arrowhead for an edge
    */    
    drawArrowHead: function (ctx, x, y, radians) {
        this._ctx.lineWidth = 1;
        this._ctx.save();
        this._ctx.beginPath();
        this._ctx.translate(x,y);
        this._ctx.rotate(radians);
        this._ctx.moveTo(0,0);
        this._ctx.lineTo(5,10);
        this._ctx.lineTo(-5,10);
        this._ctx.closePath();
        this._ctx.restore();
        this._ctx.stroke();
    },

    /*
    * Handles drawing the score tweens
    */
    drawScoreItems: function () {
        for (var i = this._scores.length - 1; i >= 0; i--){
            var s = this._scores[i];
            // remove the score if it is complete
            if (s.complete) {
                this._scores.splice(i, 1);   
                continue; 
            }

            this._ctx.fillStyle = s.points > 0 ? "rgba(92,184,92,"+ s.a +")" : "rgba(217,83,79,"+ s.a +")";
            this._ctx.strokeStyle = "rgba(0,0,0,"+ s.a +")";
            this._ctx.lineWidth = 2;
            this._ctx.font = REN.FONT_STYLE;
            this._ctx.strokeText(s.points, s.x, s.y);
            this._ctx.fillText(s.points, s.x, s.y);
        }
    },

    /*
    * Start a score tween
    */    
    startScoreTween: function (points, x, y) {
        var score = {
            points: points,
            x: x,
            y: y,
            a: 1,
            complete : false
        };
        this._scores.push(score);

        var tween = new TWEEN.Tween(score)
            .to({ x: x, y: y - 100, a: 0 }, 2000)
            .onComplete(function (a, b) {
                this.complete = true;
            })
            .start();
    },

    /*
    * Add the score effect
    */    
    addScoreEffect: function (node, score) {
        if (!node) return;

        var w = REN.NODE_WIDTH;
        var pt = this._ps.toScreen(node.p);

        if (!pt) return;        
        this.startScoreTween(score, pt.x - w / 2, pt.y - w / 2);
    }
}