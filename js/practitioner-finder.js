d3.select(window).on("resize", throttle);

var width = document.getElementById('map').offsetWidth-1;
var height = width * 2/3;

var topo,projection,path,svg,g;

var activeFilters = [];
var expertList = new ExpertList( experts ); // experts is a global variable defined in index.html

// Global variable to hold the country that is currently selected in the map:
var selected_country = null;

var mapColor = "#c19a6b";

var zoom = d3.behavior.zoom()
  .scaleExtent([1, 8])
  .on("zoom", move)
  .on("zoomend", showPractioners );

// dimensions of the svg element containing the map
var svgBBox = {top: -height/2, left: -width/2, bottom: height/2, right: width/2};
//var svgBBox = {
//  "type": "Feature",
//  "bbox": [-180.0, -90.0, 180.0, 90.0],
//  "geometry": {
//  "type": "Polygon",
//    "coordinates": [[
//    [-width/2, -height/2], [20.0, 90.0], [180.0, -5.0], [-30.0, -90.0]
//  ]]
//  }
//}

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

    setupExpertTable();
    drawExpertTable();
}

//Add listener to filter checkboxes
$('.checkbox input[type=checkbox]').change( function() {
    if (this.checked) {
        activeFilters.push(this.value);
    }
    else {
        activeFilters = _.without(activeFilters, this.value);
    }
    drawExpertTable();
});

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
//            if currentCountry != country {
//              drawExpertTable()
//            }
        })
        .on("mouseout",  function(d,i) {
            tooltip.classed("hidden", true)
        })
        .on('click', function(d, i) {
            if (d.properties.name == selected_country) {
                selected_country = null;
            }
            else {
                selected_country = d.properties.name;
            }
            drawExpertTable();
    })

}

function redraw() {
    width = document.getElementById('map').offsetWidth-1;
    height = width / 2;
    d3.select('svg').remove();
    setup(width,height);
    draw(topo);
}

function zoomed() {
    g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function move() {

    var t = d3.event.translate;
    var s = d3.event.scale;
    var h = height / 3;

    t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2 * (1 - s), t[0]));
    t[1] = Math.min(height / 2 * (s - 1) + h * s, Math.max(height / 2 * (1 - s) - h * s, t[1]));

    g.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");
}

function showPractioners() {
  console.log("zoom end");
}

/**
 * JUST AN EXPERIMENT -- NOT IN USE
 * Add zoom functions using button + and _.
 */
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

/**
 * Creates head and empty tbody of expert table.
 */
function setupExpertTable() {
    var expertTable = $('#expert-table');
    expertTable.html('<thead><tr>' +
    '<th class="header headerSortUp headerSortDown">Last Name</th>' +
    '<th class="header  headerSortUp headerSortDown" >First Name</th>' +
    '<th class="header headerSortUp headerSortDown">Country</th>'+
    '<th class="header">Experiences</th></tr></thead>' +
    '<tbody>');
}
/**
 * Resets the rows of the expert table tbody with the currently filtered experts.
 */
function drawExpertTable() {
    var expertTableBody = $('#expert-table tbody');
    expertTableBody.empty();

    var showingExperts = selected_country ? expertList.filterByCountry(selected_country) : expertList;
    if (activeFilters.length > 0 ) {
        showingExperts = showingExperts.filterByExperiences(activeFilters);
    }

    $.each(showingExperts.experts, function(index, expert){
        var row =   '<tr><td class="last-name">' + expert.last_name + '</td>'+
                    '<td class="first-name">'  + expert.first_name + '</td>' +
                    '<td class="country">' + expert.country + '</td> + ' +
                    '<td class="experiences">' + expert.experiences.join(' ') + '</td></tr>';
        expertTableBody.append(row);
    })

    //$('#expert-table').tablesorter({
    //    widthFixed: true,
    //    widgets: ['zebra'
    //}).tablesorterPager({container: $("#pager")});
}


/**
 * JUST AN EXPERIMENT -- NOT IN USE
 * Check whether center of bounding is within visible part of the map.
 * @param bbox
 * @return true if bbox center is visible, false otherwise
 */
function isInFrame( bbox ) {
  var bboxCenterX = (bbox[1][0] - bbox[0][0]) / 2  // bottom-left.x - topright.x
  var bboxCenterY = (bbox[1][1] - bbox[0][1]) / 2 // bottom-left.y - topright.y
  if (bboxCenterX < svgBBox.left) return false;
  if (bboxCenterX > svgBBox.right) return false;
  if (bboxCenterY < svgBBox.top) return false;
  if (bboxCenterY > svgBBox.bottom) return false;
  return true;
}