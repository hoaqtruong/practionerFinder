d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", move);

console.log(zoom.translate());

var width = document.getElementById('map').offsetWidth-1;
var height = width * 2/3;

var topo,projection,path,svg,g;

var mapColor = "#c19a6b";

var tooltip = d3.select("#map").append("div").attr("class", "tooltip hidden");

//document.getElementById("zoom_in").click(zoomManual("in"));

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

    drawExpertTable();
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
        .style("fill", mapColor);
        //Fill with default colors in the json file
        //.style("fill", function(d, i) { return d.properties.color; });

    //offsets plus width/height of transform, plus 20 px of padding, plus 20 extra for tooltip offset off mouse
    var offsetL = document.getElementById('map').offsetLeft+(width/2)+40;
    var offsetT = document.getElementById('map').offsetTop+(height/2)+20;

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
        })
        .on('click', function(d, i) {
            drawExpertTable(d.properties.name);
    })

}

function redraw() {
    width = document.getElementById('map').offsetWidth-1;
    height = width / 2;
    d3.select('svg').remove();
    setup(width,height);
    draw(topo);
}

function move() {

    var t = d3.event.translate;
    var s = d3.event.scale;
    var h = height / 3;

    console.log(d3.event.translate);

    t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
    t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

    zoom.translate(t);
    g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");

}


function zoomManual(zoomDirection) {

    if (zoomDirection == "in") {
        var newZoom = zoom.scale() * 1.5;
        var newX = ((zoom.translate()[0] - (width / 2)) * 1.5) + width / 2;
        var newY = ((zoom.translate()[1] - (height / 2)) * 1.5) + height / 2;
    }
    else {
        var newZoom = zoom.scale() * .75;
        var newX = ((zoom.translate()[0] - (width / 2)) * .75) + width / 2;
        var newY = ((zoom.translate()[1] - (height / 2)) * .75) + height / 2;
    }
    zoom.scale(newZoom).translate([newX,newY]);
    move();
}

var throttleTimer;
function throttle() {
    window.clearTimeout(throttleTimer);
    throttleTimer = window.setTimeout(function() {
        redraw();
    }, 200);
}

function drawExpertTable(country) {
    var table = $('#expert-table');
    table.html('<tr><th>Name</th><th>Country</th> </tr>');
    $.each(experts.filterAndSort(country), function(index, expert){
        var row = '<tr><td>' + expert.first_name + ' ' + expert.last_name + '</td><td>' + expert.country + '</td></tr>';
        table.append(row);
    })
}