/**
 * Created by hoa on 05/03/15.
 */

//queue
(function(){function n(n){function t(){for(;f=a<c.length&&n>p;){var u=a++,t=c[u],r=l.call(t,1);r.push(e(u)),++p,t[0].apply(null,r)}}function e(n){return function(u,l){--p,null==d&&(null!=u?(d=u,a=s=0/0,r()):(c[n]=l,--s?f||t():r()))}}function r(){null!=d?v(d):i?v(d,c):v.apply(null,[d].concat(c))}var o,f,i,c=[],a=0,p=0,s=0,d=null,v=u;return n||(n=1/0),o={defer:function(){return d||(c.push(arguments),++s,t()),o},await:function(n){return v=n,i=!1,s||r(),o},awaitAll:function(n){return v=n,i=!0,s||r(),o}}}function u(){}"undefined"==typeof module?self.queue=n:module.exports=n,n.version="1.0.4";var l=[].slice})();



var width = document.getElementById('map').offsetWidth-5;
var height = width * 2/3;

var instruction = "Use zoom and pan tools to find a Asset Recovery Practitioner or simple use the below drop down menu to find by country";

var topo,projection,path,svg,g,all,cdata,ccapitals,
    current = 16; //current country, randomly choosen number

var tooltip = d3.select("body").append("div").attr("class", "tooltip hidden");

setup(width,height);

function setup(width,height){

    projection = d3.geo.mercator().translate([0, 0]).scale(width / 2 / Math.PI);

    path = d3.geo.path().projection(projection);

    svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill","#fff")
        .on("click", loadworldmap);

    var outterg = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    g = outterg.append("g").attr("id", "innerg");

    //setup next and previous links
    d3.select("#next").on("click",function(){
        var next = current + 1;
        if(cdata[next] !== undefined){
            loadit(cdata[next]);
            current++;
        }
    });

    d3.select("#previous").on("click",function(){
        if(current == 0){
            var previous = all-1;
        } else {
            var previous = current-1;
        }
        if(cdata[previous] !== undefined){
            loadit(cdata[previous]);
            current--;
        }
    });

}


queue()
    .defer(d3.csv, "data/countries-data.csv")
    .defer(d3.json, "data/capitals.json")
    .await(ready);

function ready(error, countries, capitals) {
    cdata = countries;
    ccapitals = capitals;

    loadworldmap();


    //country dropdown
    var options = '';
    cdata.forEach(function(d) {
        options += '<option value="'+d.iso_a3+'">'+d.name+'</option>';
    });

    d3.select("#country").html(options)
        .on("change", function() {
            var sel = this.value;
            var obj = cdata.filter(function(f){return f.iso_a3 == sel;})[0];
            loadit(obj);
        });

    //color countries and print country names to info box
    function colorandprint(objs,title){
        d3.selectAll('.country').style('fill','#ccc'); //clear

        var html = '<h2>Category: '+title+'</h2><br><br>';

        objs.forEach(function(f){
            d3.select('.country[title="'+f.name+'"]').style('fill','#666')
            html += f.name+'<br>';
        });

        d3.select("#info").html(html);
    }

    //income dropdown
    d3.select("#income").on("change", function() {

        d3.select("#economy")[0][0].selectedIndex = 0;

        var sel = this.value;
        if(sel !== 0){
            var objs = cdata.filter(function(f){return f.income_grp == sel});
            colorandprint(objs,sel);
        }

    });

    //economy dropdown
    d3.select("#economy").on("change", function() {

        d3.select("#income")[0][0].selectedIndex = 0;

        var sel = this.value;
        if(sel !== 0){
            var objs = cdata.filter(function(f){return f.economy == sel});
            colorandprint(objs,sel);
        }

    });

}


function loadworldmap() {

    clear();
    g.style("stroke-width", 1).attr("transform", "");
    d3.select("#next").style("visibility","hidden");
    d3.select("#previous").style("visibility","hidden");

    d3.json("data/world-topo-110m.json", function(error, world) {

        var topo = topojson.feature(world, world.objects.countries).features;

        var country = d3.select("#innerg").selectAll(".country").data(topo);


        //Tooltip country name
        country.enter().insert("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("id", function(d,i) { return d.id; })
            .attr("title", function(d,i) { return d.properties.name; })
            .style("fill", "#ccc")
            .style("stroke", "#111")
            .on("click", click)
           .on("mousemove", mouseover)
            .on("mouseout",  function(d,i) {
                tooltip.classed("hidden", true);
            });

       d3.select("#instruction").text(instruction);

    });

}

function mouseover(d,i) {
    //Tooltip offsets away from mouse pointer
    var offsetL = document.getElementById('map').offsetLeft+30;
    var offsetT = document.getElementById('map').offsetTop-30;
    var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

    //print tooltip country name
    tooltip.classed("hidden", false)
        .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
        .html(d.properties.name);

}

function click(d) {
    //click going to the country
    var obj = cdata.filter(function(f){return f.iso_n3 == d.id})[0];
    loadit(obj);
}


function loadit(countryobj) {

    tooltip.attr("class","tooltip hidden");
    d3.select("#next").style("visibility","");
    d3.select("#previous").style("visibility","");

    var name = countryobj.name;
    var code = countryobj.iso_a3;
    var filename = "data/countries-10m-topojson/"+code+".json";

    d3.json(filename, function(error, country) {

        var obj = topojson.feature(country, country.objects[code]);

        clear();

        var b = path.bounds(obj);
        var s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);


        //Center the country to the middle of the map
        g.style("stroke-width", 1 / s).attr("transform", "scale(" + s + ")" +
        "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");


        d3.select("#innerg").append("path").datum(obj)
            .style("fill","#ccc")
            .style("stroke", "#111")
            .attr("d", path);

        d3.select("#instruction").text(name);

        //data object to html
        var html = '';

        for (var o in countryobj) {
            if (countryobj.hasOwnProperty(o)) {
                var label = o;
                var value = countryobj[o];
                var info = '<div><label>'+label+'</label><span>'+value+'</span></div>';
                html += info; //with formatting
            }
        }

        d3.select("#info").html(html);

        //find the capital
        var cap = ccapitals.filter(function(f){ if(f.country == name){ return f; }  });
        if(cap.length > 0){
            var capital = cap[0].capital;
            var lat = cap[0].lat;
            var lon = cap[0].lon;
            var lonlat = [lon,lat]; //reversed for d3

            //plot the capital
            var x = projection(lonlat)[0];
            var y = projection(lonlat)[1];

            var size = (1/s * 30);
            var p = (1/s * 10);

            g.append("svg:circle")
                .attr("class","point")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", p)
                .style("fill","#000");

            g.append("text")
                .attr("x", x+.5)
                .attr("y", y)
                .style("font-size", size)
                .text(capital);

        }


    });


}

function clear(){
    //clear shit
    d3.selectAll("path").remove();
    d3.selectAll("circle").remove();
    d3.selectAll("text").remove();
    d3.select("#info").html("");
}

//SAVE TO IMAGE
//d3.select("#save").on("click", function(){
//    var html = d3.select("svg")
//        .attr("version", 1.1)
//        .attr("xmlns", "http://www.w3.org/2000/svg")
//        .node().parentNode.innerHTML;
//
//    console.log(html);
//
//    var img = '<img src="data:image/svg+xml;base64,'+ btoa(html)+'">';
//    d3.select("#info").html(img);
//});

