console.log('final');

var m = {t:75,r:100,b:125,l:125};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',3000)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

var countryMap = d3.map();


//Import Data
d3.queue()
    .defer(d3.csv, '../Summer-Olympics-Medals-Competition/data/Olympic1972-2008.csv',parseMedal)
    .defer(d3.csv, '../Summer-Olympics-Medals-Competition/data/IOC.csv',parseCode)
    .await(function(err, medal, code){

        //console.log(medal);
        //console.log(code);

        //Mine the data to set the scales
        var medalsByYear = d3.nest().key(function(medal){return medal.year})
            .key(function(medal){return medal.discipline})
            .entries(medal);

        var axisYear = medalsByYear.map(function(d){
            return d.key;
        });
        //console.log(axisYear);

        var medalsByDiscipline = d3.nest().key(function(medal){return medal.discipline})
            .entries(medal);

        //console.table(medalsByDiscipline);

        var axisDiscipline = medalsByDiscipline.map(function(d){
            return d.key;
        });

        axisDiscipline.sort().reverse();

        console.log(axisDiscipline);

        //Scale
        var scaleX = d3.scaleBand()
            .domain(axisYear)
            .range([0,w]);

        var scaleY = d3.scaleBand()
            .domain(axisDiscipline)
            .range([2800,0]);
        
        //scale of circle
        var scaleR = d3.scaleLinear()
            .range([0,50]);
        
        //Axis
        var axisX = d3.axisBottom()
            .scale(scaleX);

        var axisY = d3.axisLeft()
            .scale(scaleY);

        //nest data by country, year, displine
        var medalsByCountry = d3.nest().key(function(medal){return medal.noc})
            .key(function(medal){return medal.year})
            .key(function(medal){return medal.discipline})
            .entries(medal);

        console.log(medalsByCountry);

        var medals = medalsByYear.map(function(d) {
            return d.values.map(function(e){return e.values.length})
        }).reduce(function(p, c){ return p.concat(c); }, []);

        scaleR.domain([0, d3.max(medals)]);
        //console.log(medalsByCountry);
        //console.log(medalsByCountry.values);

        //draw total medals
        plot.selectAll('.totalMedalsByYear')
            .data(medalsByYear,function(d){return d.values})
            .enter()
            .append('g')
            .attr('class','totalMedalsByYear')
            .attr('transform',function(d){
                    return 'translate('+(50+scaleX(d.key))+',0)';
                })
              .selectAll('totalMedals')
              .data(function(d){
                //console.log(d.values);
                return d.values;})
              .enter()
              .append('circle')
              .attr('class','totalMedals')
              .style('fill','none')
              .style('stroke-width','0.5px')
              .style('stroke','B7B9B4')
              .attr('cy',function(d){
                        return (37+scaleY(d.key));})
              .attr('r',function(d){
                        return scaleR(d.values.length);});


        medalsByCountry = medalsByCountry.map(function(d){
            var countryObj = code.filter(function(e){ return d.key == e.ioc; })
            if (countryObj.length > 0){
                d.key = countryObj[0].country; }
            return d;  });

        medalsByCountry.sort(function(a,b){
            return d3.ascending(a.key,b.key);
        });
        //add dropdown-menu
        d3.select('.dropdown-menu')
          .selectAll('li')
          .data(medalsByCountry)
          .enter()
          .append('li')
          .append('a')
          .html(function(d){
            var countryName = countryMap.get(d.key);
            return d.key;})
          .attr('href','#')
          .on('click',function(d){
            d3.event.preventDefault();
            console.log(d);
            draw(d.values);
            d3.select('button').html(d.key);

          });

        //draw
        function draw(data) {
        //console.log(data);

        // UPDATING DATA AND DOM ELEMENTS FOR g.medalsByYear
        var update = plot
            .selectAll('.medalsByYear') //
            .data(data, function(d){ return d.key; });

        update.exit().remove();
        
        var enter = update
            .enter()
            .append('g')
            .attr('class','medalsByYear')
            .attr('transform',function(d){
                    return 'translate('+(50+scaleX(d.key))+',0)';
                })
            .attr("year", function(d){return d.key;});

        update = update.merge(enter);

        // UPDATING DATA AND DOM ELEMENTS FOR circle.medalsBySize
        var allCircles = update
            .selectAll('.medalsBySize')
            .data(function(d){return d.values;}, function(d){ return d.key; });

        allCircles.exit().remove();

        allCircles.enter()
            .append('circle')
            .attr('r', 0)
            .attr('class','medalsBySize')
            .style('fill','3CB4BE')
            .on('mouseenter',function(d){
                //console.log(d);
                var tooltip = d3.select('.custom-tooltip')
                    .style('fill','white')
                    .style('opacity',1)
                    .style('visibility','visible')
                    .style('width','150px')
                    .style('background','#B7B9B4');
                /*tooltip.select('.title')
                       .html(countryMap.get(d.values[0].noc));*/
                tooltip.select('.discipline')
                       .html(d.key);
                tooltip.select('.value')
                       .html('Medals: '+d.values.length);
            })
            .on('mousemove',function(d){
                var tooltip = d3.select('.custom-tooltip');
                var xy = d3.mouse(d3.select('.container').node());
                tooltip
                    .style('left',xy[0]+10+'px')
                    .style('top',xy[1]+10+'px')})
            .on('mouseleave',function(d){
                var tooltip = d3.select('.custom-tooltip');
                tooltip.transition().style('opacity',0);
                d3.select(this).style('stroke-width','0px');
            })
            .merge(allCircles) // merge enter and update sets
            .attr('cy',function(d){
                    return (37+scaleY(d.key));})
            .transition().duration(500)
            .attr('r',function(d){
                return scaleR(d.values.length);
            })
            .attr("country", function(d){
                return d.values[0].noc;});;


        }

        //Draw axis

        plot
            .append('g')
            .attr('class','axis-y')
            .call(axisY);
    });

//import data for axis year
d3.queue()
    .defer(d3.csv, '../Summer-Olympics-Medals-Competition/data/Olympic1972-2008.csv',parseMedal)
    .defer(d3.csv, '../Summer-Olympics-Medals-Competition/data/IOC.csv',parseCode)
    .await(function(err, medal, code){

       var medalsByYear = d3.nest().key(function(medal){return medal.year})
            .key(function(medal){return medal.discipline})
            .entries(medal);

        var axisYear = medalsByYear.map(function(d){
            return d.key;});
        
        //Scale
        var scaleX = d3.scaleBand()
            .domain(axisYear)
            .range([0,w]);

        //axis
        var axisX = d3.axisBottom()
            .scale(scaleX);
        
        d3.select('.year')
          .append('svg')
          .attr('width',outerWidth)
          .attr('height',50)
          .append('g')
          .attr('transform','translate('+m.l+',0)')
            .append('g')
            .attr('class','axis-x')
            .attr('transform','translate(75,10)')
            .call(axisX);

     })




function parseMedal(d){

    return {
        year: +d['Edition'],
        discipline: d['Discipline'],
        noc: d['NOC'],
        medal: d['Medal'],

    };

}

function parseCode(d){
    countryMap.set(d['Int Olympic Committee code'], d['Country']);
    
    return {
        country: d['Country'],
        ioc: d['Int Olympic Committee code']
    };

}
