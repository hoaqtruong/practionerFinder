d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 4])
    .on("zoom", move);

var width = document.getElementById('map').offsetWidth;
var height = width / 2;
var biogRed = "#93173B";
var mapColor = "#c19a6b";
var topo,projection,path,svg,g;

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

}

d3.json("data/world-topo-min.json", function(error, world) {

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

    //ofsets plus width/height of transform, plsu 20 px of padding, plus 20 extra for tooltip offset off mouse
    var offsetL = document.getElementById('map').offsetLeft+(width/2);
    var offsetT =document.getElementById('map').offsetTop+(height/2);

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

    //print instruction

}

function redraw() {
    width = document.getElementById('map').offsetWidth;
    height = width / 2;
    d3.select('svg').remove();
    setup(width,height);
    draw(topo);
}

function move() {

    var t = d3.event.translate;
    var s = d3.event.scale;
    var h = height / 3;

    t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
    t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

    zoom.translate(t);
    g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");

}

var throttleTimer;
function throttle() {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
        redraw();
    }, 200);
}