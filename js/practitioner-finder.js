d3.select(window).on("resize", throttle);

//Zoom map by wheel
var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8]) //range of zoom scale as [minimum, maximum].
    .on("zoom", zoomed);


console.log(zoom);

//Zoom map by buttons


var width = document.getElementById('map').offsetWidth-1;
var height =  width * 2/3 ;

var topo,projection,path,svg,g;

//var color = d3.scale.quantize()
//    .range(["rgb(237,248,233)", "rgb(186,228,179)",
//        "rgb(116,196,118)", "rgb(49,163,84)","rgb(0,109,44)"]);
var mapColor = "#ccb9b4";
var biogRed = "#93173B" ;

var instruction = "Use zoom and pan tools to find a Asset Recovery Practitioner or simply use the below drop down menu to find by country";

var tooltip = d3.select("#map").append("div").attr("class", "tooltip hidden");

setup(width,height);

function setup(width,height){
    projection = d3.geo.mercator()
        .translate([0, 0])
        .scale(width / 2 / Math.PI);

    path = d3.geo.path()
        .projection(projection);

    svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
        .call(zoom);

    g = svg.append("g");

    d3.select("#instruction").text(instruction);

}

d3.json("data/world-topo.json", function(error, world) {

    var countries = topojson.feature(world, world.objects.countries).features;

    topo = countries;
    draw(topo);


});

function draw(topo) {

    var country = g.selectAll(".country").data(topo);

    country.enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d,i) { return d.properties.name; })
        .style("fill", mapColor );
        // default colors
        //.style("fill", function(d, i) { return  d.properties.color; });

    //ofsets plus width/height of transform, plsu 20 px of padding, plus 20 extra for tooltip offset off mouse
    var offsetL = document.getElementById('container').offsetLeft+(width/2)+40;
    var offsetT =document.getElementById('container').offsetTop+(height/2)+20;

    //tooltips
    country
        .on("mousemove", function(d,i) {
            var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
            tooltip
                .classed("hidden", false)
                .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
                .html(d.properties.name)
        })
        .on("mouseout",  function(d,i) {
            tooltip.classed("hidden", true)
        });

}

function redraw() {
    width = document.getElementById('map').offsetWidth-1;
    height = width / 2;
    d3.select('svg').remove();
    setup(width,height);
    draw(topo);
}

//To zoom by wheel
function zoomed() {
    //svg.attr("transform",
    //    "translate(" + zoom.translate() + ")" +
    //    "scale(" + zoom.scale() + ")"
    //);

    //BELOW IS WORKING CODE, BUT WANT TO TEST BUSSTOCK EXAMPLE ON ZOOM
    var t = d3.event.translate;
    var s = d3.event.scale;
    var h = height / 3;

    t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
    t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

    zoom.translate(t);
    g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");

}
function interpolateZoom (translate, scale) {
    var self = this;
    return d3.transition().duration(350).tween("zoom", function () {
        var iTranslate = d3.interpolate(zoom.translate(), translate),
            iScale = d3.interpolate(zoom.scale(), scale);
        return function (t) {
            zoom
                .scale(iScale(t))
                .translate(iTranslate(t));
            zoomed();
        };
    });
}

function zoomClick() {
    var clicked = d3.event.target,
        direction = 1,
        factor = 0.2,
        target_zoom = 1,
        center = [width / 2, height / 2],
        extent = zoom.scaleExtent(),
        translate = zoom.translate(),
        translate0 = [],
        l = [],
        view = {x: translate[0], y: translate[1], k: zoom.scale()};

    d3.event.preventDefault();
    direction = (this.id === 'zoom_in') ? 1 : -1;
    target_zoom = zoom.scale() * (1 + factor * direction);

    if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

    translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
    view.k = target_zoom;
    l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

    view.x += center[0] - l[0];
    view.y += center[1] - l[1];

    interpolateZoom([view.x, view.y], view.k);
}

//d3.selectAll('button').on('click', zoomClick);




// To zoom by buttons
function zoomBtn(action, mapFeatures) {
    var currentZoom = zoom.scale();
    var options = zoom.scaleExtent();

    //D3 zooms the center of svg, not at top left
    //Therefore, we need to zeroing svg, stretching it, then unzero again

    //x = (x - center[0]) * factor + center[0];
    //y = (y - center[1]) * factor + center[1];

    if( action == 'in' ){
        if(currentZoom < options.maxZoomLevel){
            var newScale = Math.floor(currentZoom) + 1;

            var b = path.bounds(mapFeatures);
            var t = [(width - newScale * (b[1][0] + b[0][0])) / 2, (height - newScale * (b[1][1] + b[0][1])) / 2];

            zoom.scale(newScale)
                .translate(t)
                .event(svg);
        }
    }else{
        if(currentZoom > options.minZoomLevel){
            var newScale = Math.floor(currentZoom) - 1;

            var b = path.bounds(mapFeatures);
            var t = [(width - newScale * (b[1][0] + b[0][0])) / 2, (height - newScale * (b[1][1] + b[0][1])) / 2];

            zoom.scale(newScale)
                .translate(t)
                .event(svg);
        }
    }
}


var throttleTimer;
function throttle() {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
        redraw();
    }, 200);
}

/*------------------helper functions--------------------- */
