function getDate() {
    var months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
    var d = new Date();
    var month = months[d.getMonth()];
    var year = d.getFullYear();
    var day = d.getUTCDate();

    return month + " " + day + ", " + year;
}

function drawChart() {
    var selected_polygon = getSelectedPolygon();
    var energyProduction = selected_polygon.energyProduction;

    var data = new google.visualization.arrayToDataTable([
        ['Month', 'Energy Production (kWh)'],
        ['January', energyProduction[0]],
        ['February', energyProduction[1]],
        ['March', energyProduction[2]],
        ['April', energyProduction[3]],
        ['May', energyProduction[4]],
        ['June', energyProduction[5]]
    ]);

    var options = {
        title: "Solar Power Output on " + getDate(),
        legend: 'none'
    }

    var chart_canvas = document.createElement('canvas');
    chart_canvas.width = 500;
    chart_canvas.height = 400;

    var ctx = chart_canvas.getContext('2d');

    var chart = new google.visualization.ColumnChart(chart_canvas);

    google.visualization.events.addListener(chart, 'ready', function() {
        chart_base64 = chart.getImageURI();
        canvas = null; // delete DOM
    })

    chart.draw(data, options);
}

function getEnergyProduction(latlngCenter, tiltValue, azimuthValue, systemCapacity, callback) {
    $.ajax({
        type : "POST",
        url  : "/nrel",
        data : JSON.stringify({"lat"      : latlngCenter.lat(),
                               "lng"      : latlngCenter.lng(),
                               "tilt"     : tiltValue, 
                               "azimuth"  : azimuthValue,
                               "capacity" : systemCapacity}, 
                               null, '\t'),
        contentType: 'application/json; charset=UTF-8',
        success: function (result) {
            callback(result);
        }
    })
}

function CenterControl(controlDiv, map) {
    // Set CSS for the control border.

    // FOR DEMO
    if (MYLIBRARY.getIsDemo()) {
        // add demo code
    }

    var controlUI = document.createElement('div');
    controlUI.id = 'control';
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.padding = '10px';
    controlUI.style.textAlign = 'left';
    controlUI.innerHTML = '<a data-toggle="collapse" href="#collapse1"><h5>Project Settings<span class="caret" style="margin-left:5px;"></span></h5></a>';
    controlDiv.appendChild(controlUI);

    var selectPanel = document.createElement('select');
    selectPanel.className = 'form-control';
    selectPanel.id = 'panel_specs';

    //creates dropdown for different pv panels

    var panel_specs = MYLIBRARY.getPanelSpecs();
    for(var i=0;i<panel_specs["panels"].length;i++) {
        var p = panel_specs["panels"][i];
        var optionPanel = document.createElement('option');
        optionPanel.innerHTML = p['model_name'];
        optionPanel.value = p['id'];
        optionPanel.setAttribute('data-wattage', p['wattage']);
        optionPanel.setAttribute('data-length', p['length']);
        optionPanel.setAttribute('data-width', p['width']);
        selectPanel.appendChild(optionPanel);
    }

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.id = 'collapse1',
    controlText.className = "panel-collapse collapse"
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontSize = '11px';
    controlText.style.lineHeight = '10px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = '<div id="projectStats"></div>';   
    controlText.innerHTML += '<input style="margin-top:15px;" class="form-control" id ="azimuth" type="text" placeholder="Azimuth (0-360 deg)">';            
    controlText.innerHTML += '<input class="form-control" id ="tilt" type="text" placeholder="Tilt (0-90 deg)">';
    controlText.innerHTML += '<input class="form-control" id ="rowSpace" type="text" placeholder="Row space (>1 ft)">';
    controlText.innerHTML += '<select class="form-control" id="orientation"><option value="portrait" selected>Portrait</option><option value="landscape">Landscape</option></select>';
    
    controlText.appendChild(selectPanel)
    controlUI.appendChild(controlText);

    controlText.innerHTML += '<div class="action">\
                                <div id="submit">\
                                    <button class="btn btn-default" id="update">Update</button>\
                                </div>\
                                <div id="email">\
                                    <button class="btn btn-default" id="sendemail">Email Report</button>\
                                </div>\
                              </div>';
}

function sendEmailReportListener() {
    // listener for email report button click
    document.getElementById('sendemail').onmousedown = function(){
        var selected_polygon = getSelectedPolygon();
        // zoom into polygon
        // setZoomOnPolygon(selected_polygon);
        map.setCenter(selected_polygon.latlngCenter);
        map.setZoom(20);

        listener = google.maps.event.addListenerOnce(map, 'tilesloaded', function(event) {
            setTimeout(sendEmail(selected_polygon), 5000);
        });

        setTimeout(function() { google.maps.event.removeListener(listener)}, 2000);
    };
}

function sendEmail(selected_polygon) {
    google.charts.setOnLoadCallback(drawChart);

    // http://stackoverflow.com/questions/24046778/html2canvas-does-not-work-with-google-maps-pan
    // stack overflow solution to take a screenshot of googlemaps
    var transform=$(".gm-style>div:first>div").css("transform")
    var comp=transform.split(",") // split up the transform matrix
    var mapleft=parseFloat(comp[4]) // get left value
    var maptop=parseFloat(comp[5]) // get top value
    $(".gm-style>div:first>div").css({ //get the map container. not sure if stable
        "transform": "none",
        "left": mapleft,
        "top": maptop,
    })
    html2canvas(document.getElementById(MYLIBRARY.getMapId()),
    {
        useCORS: true,
        onrendered: function(canvas)
        {   
            dataUrl = canvas.toDataURL('image/png');
            $(".gm-style>div:first>div").css({
                left:0,
                top:0,
                "transform": transform
            });

            $.ajax({
                type : "POST",
                url  : "/sendEmailReport",
                data : JSON.stringify({"screenshot" : dataUrl,
                                       "chart"      : chart_base64,
                                       "energy"     : selected_polygon.energyProduction,
                                       "numPanels"  : selected_polygon.numPanels}, 
                                       null, '\t'),
                contentType: 'application/json; charset=UTF-8',
                success: function (result) {
                    if (result === "success")
                        console.log("success");
                }
            });
        }
    });
}

function updateSystemListener() {
    // listener for update button click
    document.getElementById('update').onmousedown = function(){
        var selected_polygon = getSelectedPolygon();

        // check values are not null
        if (document.getElementById('azimuth').value != "")
            selected_polygon.azimuthValue = document.getElementById('azimuth').value;
        if (document.getElementById('tilt').value != "")
            selected_polygon.tiltValue = document.getElementById('tilt').value;
        if (document.getElementById('rowSpace').value != "")
            selected_polygon.rowSpaceValue = document.getElementById('rowSpace').value;
        if (document.getElementById('orientation').value != "")
            selected_polygon.orientationValue = document.getElementById('orientation').value;
        if (document.getElementById('panel_specs').value != "")
            var panelId = document.getElementById('panel_specs').value
            selected_polygon.moduleWattage = document.getElementById('panel_specs')[panelId].getAttribute('data-wattage')
            selected_polygon.panelLength = document.getElementById('panel_specs')[panelId].getAttribute('data-length')
            selected_polygon.panelWidth = document.getElementById('panel_specs')[panelId].getAttribute('data-width')
        
        selected_polygon.pArray.setMap(null); 
        output = panelLayout(selected_polygon.polygon, 
                             selected_polygon.coordinates, 
                             Number(selected_polygon.azimuthValue), 
                             selected_polygon.orientationValue, 
                             selected_polygon.rowSpaceValue, 
                             selected_polygon.tiltValue, 
                             selected_polygon.moduleWattage, 
                             selected_polygon.panelLength, 
                             selected_polygon.panelWidth);
        selected_polygon.systemCapacity = output["s"];
        selected_polygon.pArray = output["arr"];
        selected_polygon.latlngCenter = getPolygonCenter(selected_polygon.coordinates);
        getEnergyProduction(selected_polygon.latlngCenter, 
                    selected_polygon.tiltValue, selected_polygon.azimuthValue, 
                    selected_polygon.systemCapacity, function(data) {
            
            selected_polygon.energyProduction = data;
            // update table with system info
            var project_stats = document.getElementById("projectStats")
            project_stats.innerHTML = "Nameplate Capacity: " + selected_polygon.systemCapacity + "kW<br>";
            project_stats.innerHTML += "# of panels: " + selected_polygon.numPanels + "<br>";
            project_stats.innerHTML += "Energy Production: " + selected_polygon.energyProduction[2] + "kWh (monthly)";
        });   
    };
}

function selectPolygon(polygon_object) {
    unselectAllPolygons();
    polygon_object.click_status = 1;
    polygon_object.polygon.setOptions({fillColor: 'green',
                                       strokeColor: 'green'});

    var project_stats = document.getElementById("projectStats")
    project_stats.innerHTML = "Nameplate Capacity: " + polygon_object.systemCapacity + "kW<br>";
    project_stats.innerHTML += "# of panels: " + polygon_object.numPanels + "<br>";
    project_stats.innerHTML += "Energy Production: " + polygon_object.energyProduction[2] + "kWh (monthly)";
}

function getSelectedPolygon() {
    for (i=0;i<polygons.length;i++) {
        if (polygons[i].click_status == 1)
            return polygons[i];
    }
}

function unselectAllPolygons() {
    for (i=0;i<polygons.length;i++) {
        if (polygons[i].click_status == 1) {
            polygons[i].click_status = 0;
            polygons[i].polygon.setOptions({fillColor: 'yellow',
                                            strokeColor: 'yellow'});
        }
    }
}    

function printCoordinates(coordinates) {
    for (var i=0; i < coordinates.length; i++) {
        var xy = coordinates[i];
        // requires lat()/lng() as lat/lng here are functions not keys in a dictionary
        console.log("lat: " + xy.lat() + "; lng: " + xy.lng());
    }
}

// determines max distance from all points so we can decide maximum number of panels that can be placed in one direction
function maxDistance(roof_area) {
    var distance = [];
    for (var i = 0; i < roof_area.length; i++) {
        for (j = i + 1; j < roof_area.length; j++) {
            distance.push(Math.sqrt((Math.pow((roof_area[i].lng - roof_area[j].lng),2) + Math.pow((roof_area[i].lng - roof_area[j].lng),2))));
        }
    }
    return Math.max(...distance);
}

function maxDistanceXY(roof_area) {
    var distance = [];
    for (var i = 0; i < roof_area.length; i++) {
        for (j = i + 1; j < roof_area.length; j++) {
            distance.push(Math.sqrt((Math.pow((roof_area[i].x - roof_area[j].x),2) + Math.pow((roof_area[i].y - roof_area[j].y),2))));
        }
    }
    return Math.max(...distance);
}

function endCoords(roof_area) {
    var latRoof = [];
    var lngRoof = [];
    for (var i = 0; i < roof_area.length; i++) {
        // requires lat() as lat/lng here are functions 
        //not keys in a dictionary
        latRoof.push(roof_area[i].lat()); 
        lngRoof.push(roof_area[i].lng());
    }
    return [{
             lat: Math.max(...latRoof),
             lng: Math.max(...lngRoof)
    },      {
             lat: Math.min(...latRoof),
             lng: Math.min(...lngRoof)
    }]; // array of [max, min] coordinates
}

// check if a collection of points falls within a polygon
function containsPolygon(points_array, polygon) {
    for (var i = 0; i < points_array.length; i++) {
        var point = new google.maps.LatLng(points_array[i].lat, points_array[i].lng);
        var roof_check = google.maps.geometry.poly.containsLocation(point, polygon);
        if (roof_check === false) {
            return false;
        }
    }
    return true;
}

function latLngToPoint(latLng) {
    var TILE_SIZE = 256;
    var siny = Math.sin(latLng.lat * Math.PI / 180);

    // Truncating to 0.9999 effectively limits latitude to 89.189. This is
    // about a third of a tile past the edge of the world tile.
    siny = Math.min(Math.max(siny, -0.9999), 0.9999);

    return new google.maps.Point(
      TILE_SIZE * (0.5 + latLng.lng / 360),
      TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)));
}

function pointToLatLng(xy){
    var TILE_SIZE = 256;
    var newLng = 360 * (xy.x/TILE_SIZE - 0.5);

    var yConst = Math.pow(Math.E, -4*Math.PI*(xy.y/TILE_SIZE - 0.5));

    var newLat = (180/Math.PI) * Math.asin((yConst - 1)/(1 + yConst));

    var newCoord = {lat: newLat, lng: newLng};

    return newCoord;
}

function mToCoordinates(solarWidth, latlngCenter){
    var zoom = map.getZoom();
    var scale = 1<<zoom;
    var metersPerPixel = 156543.03392 * Math.cos(latlngCenter.lat() * Math.PI / 180) / Math.pow(2, zoom);
    var mToPixel = solarWidth*(1/metersPerPixel);
    var pixelToWorld = mToPixel/scale;

    return pixelToWorld;
}

function panelLayout(polygon, coordinates, azimuth, orientation, rowSpace, tilt, moduleWattage, panelLength, panelWdith) {
    //azimuth - angle of panel from true North
    //tilt - angle of panel from ground - not working properly for portrait..might be the difference between latitude/longitude conversion from meters
    //rowSpace - space between rows 
    //orientation - 'landscape' or 'portrait'
    //moduleWattage - wattage of each panel

    var latlngCenter = getPolygonCenter(coordinates);

    //tilt multiplier to adjust how the panel would look tilted
    var tilt_coeff = Math.cos(tilt*Math.PI/180);
    //solar spec before tilt is considered

    var m_solar_spec = {width: panelWdith, length: panelLength};

    var pre_solar_spec = {width: mToCoordinates(m_solar_spec.width, latlngCenter), 
                          length: mToCoordinates(m_solar_spec.length, latlngCenter)};

    if(orientation == 'portrait'){
        azimuth += 180; //not 0 bc it takes into account for the off-set so there are no negative values
        port = 1;
        lat = 0;
    } else if(orientation == 'landscape'){
        azimuth +=90
        port = 0;
        lat = 1;
    }

    var tilt_coeff = Math.cos(tilt*Math.PI/180);

    var solar_spec = {width: Math.pow(tilt_coeff, port) * pre_solar_spec.width, length:  Math.pow(tilt_coeff, lat) * pre_solar_spec.length};

    var row_space = Math.pow(rowSpace, lat); // space between row of panels
    var col_space = Math.pow(rowSpace, port); // space between column of panels

    var radius = Math.sqrt(Math.pow(solar_spec.length / 2, 2) + Math.pow(solar_spec.width / 2, 2));
    
    // angle between center and a corner point of panel
    var angleSpread = Math.atan(solar_spec.width/(solar_spec.length))*2;
    
    //determines equivalent azimuth for angles over 180 as the layout algorithm only works in one direction    

    //Converts azimuth angle into opposing angle that's under 180 deg. and converts maximum geometry angle 
    if(azimuth >= 361 && azimuth <= 540){
        azimuth -= 360;
    }

    //the panel dimension changes effects the azimuth and this variable is the offsetter for both maxGeo and azimuth
    var azimuthOffSet = (111.44889707494237 - angleSpread*180/Math.PI)/2;

    azimuth -= azimuthOffSet;

    var real_azimuthAngle = azimuth/180*Math.PI + 55.1/180*Math.PI; //63 degrees is when the two squars line up

    var thetaOffSet = -(8 + azimuthOffSet) * (Math.PI/180);

    if(azimuth >= 0 && azimuth <= 90 || azimuth >= 181 && azimuth <= 270) {
        azimuthAngle = -(real_azimuthAngle + Math.PI/2);
        var theta = (90 - azimuthAngle - thetaOffSet);

    } else if(azimuth >= 91 && azimuth <= 180 || azimuth >= 271 && azimuth <= 360){
        azimuthAngle = -(real_azimuthAngle + Math.PI/2);
        var theta = (90 - azimuthAngle - 90 * Math.PI/180 - thetaOffSet);
    }
    //Calculates maximum distance of rectangle outside that fits right ouside the polygon
    var maxArea = endCoords(coordinates);
    var dlat = Math.abs(maxArea[1].lat - maxArea[0].lat);
    var dlng = Math.abs(maxArea[1].lng - maxArea[0].lng);
    // initialize array for panel indexes
    var solarSystem = []; 
    var solarSystemXY = []; 
    //Angles to determine where central points of each panel will be in relation to the previous one
    var angle1 = (azimuthAngle + angleSpread + Math.PI);
    var angle2 = (azimuthAngle + Math.PI);
    //Geometric profile of the biggest possible recentangular area around the user selected polygon
    var maxGeo = [
        {lat: maxArea[1].lat + dlat*Math.cos(theta)*Math.cos(theta), lng: maxArea[1].lng + dlat*Math.sin(theta)*Math.cos(theta)},
        {lat: maxArea[1].lat + dlat - dlng*Math.sin(theta)*Math.cos(theta), lng: maxArea[1].lng + dlng*Math.cos(theta)*Math.cos(theta)},
        {lat: maxArea[1].lat + dlat - dlat*Math.cos(theta)*Math.cos(theta), lng: maxArea[1].lng + dlng - dlat*Math.sin(theta)*Math.cos(theta)},
        {lat: maxArea[1].lat + dlng*Math.sin(theta)*Math.cos(theta), lng: maxArea[1].lng + dlng - dlng*Math.cos(theta)*Math.cos(theta)},
    ];

    var maxGeoXY = [];

    for(i=0; i<maxGeo.length; i++){
        maxGeoXY.push(latLngToPoint(maxGeo[i]));
    }
    

    //Determines the starting point of the panel layout depending on the azimuth
    if(azimuth >= 0 && azimuth <= 90){
        var initCorner = 0;
    } else if(azimuth >= 91 && azimuth <= 180) {
        var initCorner = 1;
    } else if(azimuth >= 181 && azimuth <= 270) {
        var initCorner = 2;
    } else if(azimuth >= 271 && azimuth <= 360) {
        var initCorner = 3;
    }
    // determines max number of rows/columns in a solar system
    var maxD2 = maxDistance(maxGeo);
    var maxD2XY = maxDistanceXY(maxGeoXY);
    var smallerDimPanel = Math.min(solar_spec.width, solar_spec.length);

    var num_col = Math.round(maxD2 / smallerDimPanel);
    var num_row = num_col;

    var num_colXY = Math.round(maxD2XY / smallerDimPanel);
    var num_rowXY = num_colXY;

    // lays out panel over the polygon and determines if it's in the polygon or not

    for (j = 0; j < num_colXY; j++) {
        for (i = 0; i < num_rowXY; i++) {
            var panelCoordsXY = [];
            var centerPanelCoordXY = {

                x: maxGeoXY[initCorner].x + radius * Math.sin(angle2) * ((row_space*i - col_space*j)) + radius * Math.sin(angle1) * ((row_space*i + col_space*j)),
                y: maxGeoXY[initCorner].y + radius * Math.cos(angle2) * (row_space*i - col_space*j) + radius * Math.cos(angle1) * (row_space*i + col_space*j)
                
            };

             // start populating rooftop from min lat, max lng ==> bottom right of panel
            var pv_corner_arrayXY = [
            {   // min lat, max lng ==> bottom right of panel
                x: centerPanelCoordXY.x + radius * Math.sin(azimuthAngle),
                y: centerPanelCoordXY.y + radius * Math.cos(azimuthAngle)
                
            },
           {   // min lat, min lng ==> bottom left of panel
                x: centerPanelCoordXY.x + radius * Math.sin(azimuthAngle + angleSpread),
                y: centerPanelCoordXY.y + radius * Math.cos(azimuthAngle + angleSpread)
                
            },
            {   // max lat, min lng top left of panel
                x: centerPanelCoordXY.x + radius * Math.sin(azimuthAngle + Math.PI),
                y: centerPanelCoordXY.y + radius * Math.cos(azimuthAngle + Math.PI)
                
            },
            {   // max lat, max lng ==> top right of panel
                x: centerPanelCoordXY.x + radius * Math.sin(azimuthAngle + angleSpread + Math.PI),
                y: centerPanelCoordXY.y + radius * Math.cos(azimuthAngle + angleSpread + Math.PI)
                
            }
            ];

            //converts point coordinate to lat/lng
            for(n=0; n<pv_corner_arrayXY.length; n++){
                pv_corner_arrayXY[n] = pointToLatLng(pv_corner_arrayXY[n]);
            }

            //check if any corners are not within our rooftop polygon
            if (containsPolygon(pv_corner_arrayXY, polygon) === false) {
                continue;
            }
            //add panel to panel array
            
            for (m = 0; m < pv_corner_arrayXY.length; m++) {
                panelCoordsXY.push(pv_corner_arrayXY[m]);
            }
            
            // add panel to solar system array
            solarSystemXY.push(panelCoordsXY);
        }
    }

    var panelArray = new google.maps.Polygon({ 
        map: map,
        paths: solarSystemXY,
        strokeColor: 'grey',
        strokeOpacity: 1,
        strokeWeight: 1,
        fillColor: '#084c8d',
        fillOpacity: 1,
        zIndex: google.maps.Marker.MAX_ZINDEX
    });


    var systemCapacity = moduleWattage * solarSystemXY.length/1000;
    var numPanels = solarSystemXY.length;

    return { p: polygon,
             s: systemCapacity,
             arr: panelArray,
             numPanels: numPanels
           }
}

function setZoomOnPolygon(polygon_object) {
    var bound = new google.maps.LatLngBounds();
    for(var i=0; i<polygon_object.coordinates.length; i++) 
        bound.extend( new google.maps.LatLng(polygon_object.coordinates[i].lat(), 
            polygon_object.coordinates[i].lng()));

    map.fitBounds(bound);
}

function getPolygonCenter(coordinates) {
    var bound = new google.maps.LatLngBounds();
    for(var i=0;i<coordinates.length; i++) {
        bound.extend( new google.maps.LatLng(coordinates[i].lat(), coordinates[i].lng()));
    }
    return bound.getCenter();
}

function Polygon(polygon) // polygon object
{
    this.click_status = 0;

    this.polygon = polygon;
    this.coordinates = polygon.getPath().getArray();
    this.azimuthValue = 120;
    this.orientationValue = 'portrait';
    this.rowSpaceValue = 1.6;
    this.tiltValue = 30;
    this.moduleWattage = 235;
    this.panelLength = 1.2;
    this.panelWidth = 1.6;
    this.systemCapacity = "loading...";
    this.latlngCenter = getPolygonCenter(this.coordinates); // updated in panelLayout()
    this.energyProduction = "loading...";
    this.pArray = null;
    this.numPanels = "loading...";
}

//***GLOBAL VARIABLES******
var polygons = [];
var map;
var chart_base64;

function initialize() {
    var markers = [];
    map = new google.maps.Map(
    document.getElementById(MYLIBRARY.getMapId()), {
        center: new google.maps.LatLng(37.7918, -122.4266),
        zoom: 20,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    });

    map.setTilt(0);

    // position search bar and enable autocomplete
    var search_input = document.getElementById('user_search');
    var autocomplete = new google.maps.places.Autocomplete(search_input);
    autocomplete.bindTo('bounds', map);
    //map.controls[google.maps.ControlPosition.TOP_CENTER].push(search_input);
    // Get the full place details when the user selects a place from the
    // list of suggestions.
    var iw = new google.maps.InfoWindow();
    var m = new google.maps.Marker({
        map: map
    });
    google.maps.event.addListener(m, 'click', function() {
        iw.open(map, m);
    });
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        iw.close();
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            return;
        }
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(19);
        }
    })
    // position center control manager
    var centerControlDiv = document.createElement('div');
    var centerControl = new CenterControl(centerControlDiv, map);
    centerControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(centerControlDiv);

    // position center control manager2
    // var centerControlDiv2 = document.createElement('div');
    // var centerControl2 = new CenterControl2(centerControlDiv2, map);
    // centerControlDiv2.index = 1;
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(centerControlDiv2);

    // drawing manager
    var draw = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT,
          drawingModes: [
            google.maps.drawing.OverlayType.POLYGON
          ]
        },
        polygonOptions: {
            fillColor: 'yellow',
            strokeColor: 'yellow',
            editable: true,
            draggable: false
        }
    });
    draw.setMap(map);
    // event listener to obtain lat/lng coordinates from drawn polygon **************
    google.maps.event.addListener(draw, 'polygoncomplete', function (polygon) {
        // switch back to the hand option
        draw.setOptions({
            drawingMode: null
        });

        // create polygon object
        var p = new Polygon(polygon);
        polygons.push(p);
        // get array of vertices in lat/lng format of polygon
        var output = null;

        // select this polygon and unselect all others
        selectPolygon(p);

        // ***generate default panel layout independent of other listeners
        // requires lat() as lat/lng here are functions not keys in a dictionary
        output = panelLayout(polygon, p.coordinates, Number(p.azimuthValue), p.orientationValue, p.rowSpaceValue, p.tiltValue, p.moduleWattage, p.panelLength, p.panelWidth);
        p.systemCapacity = output["s"];
        p.pArray = output["arr"];
        p.numPanels = output["numPanels"];
        getEnergyProduction(p.latlngCenter, p.tiltValue, p.azimuthValue, p.systemCapacity, function(data) {
            p.energyProduction = data;
            // update table with system info
            var project_stats = document.getElementById("projectStats")
            project_stats.innerHTML = "Nameplate Capacity: " + p.systemCapacity + "kW<br>";
            project_stats.innerHTML += "# of panels: " + p.numPanels + "<br>";
            project_stats.innerHTML += "Energy Production: " + p.energyProduction[2] + "kWh (monthly)";

            // listener for click on polygon
            google.maps.event.addListener(p.polygon, 'click', function () {
                // select this polygon and unselect all others
                selectPolygon(p);
            });
            google.maps.event.addListener(p.pArray, 'click', function () {
                selectPolygon(p);
            });
        });

        // listen for edit event on moving existing vertices
        google.maps.event.addListener(p.polygon.getPath(), "set_at", function() {
            selectPolygon(p);
            p.coordinates = p.polygon.getPath().getArray();
            p.pArray.setMap(null); 
            output = panelLayout(p.polygon, p.coordinates, Number(p.azimuthValue), p.orientationValue, p.rowSpaceValue, p.tiltValue, p.moduleWattage, p.panelLength, p.panelWidth);
            p.systemCapacity = output["s"];
            p.pArray = output["arr"];
            p.numPanels = output["numPanels"];
            p.latlngCenter = getPolygonCenter(p.coordinates);
            getEnergyProduction(p.latlngCenter, p.tiltValue, p.azimuthValue, p.systemCapacity, function(data) {
                p.energyProduction = data;
                selectPolygon(p);
            });

            google.maps.event.addListener(p.pArray, 'click', function () { selectPolygon(p); });
        })
        // listen for edit event on adding new vertices
        google.maps.event.addListener(p.polygon.getPath(), "insert_at", function() {
            selectPolygon(p);
            p.coordinates = p.polygon.getPath().getArray();
            p.pArray.setMap(null); 
            output = panelLayout(p.polygon, p.coordinates, Number(p.azimuthValue), p.orientationValue, p.rowSpaceValue, p.tiltValue, p.moduleWattage, p.panelLength, p.panelWidth);
            p.systemCapacity = output["s"];
            p.pArray = output["arr"];
            p.numPanels = output["numPanels"];
            p.latlngCenter = getPolygonCenter(p.coordinates);
            getEnergyProduction(p.latlngCenter, p.tiltValue, p.azimuthValue, p.systemCapacity, function(data) {
                p.energyProduction = data;
                selectPolygon(p);
            });

            google.maps.event.addListener(p.pArray, 'click', function () { selectPolygon(p); });
        })
        // listen for undo edit event on polygon
        google.maps.event.addListener(p.polygon.getPath(), "remove_at", function() {
            selectPolygon(p);
            p.coordinates = p.polygon.getPath().getArray();
            p.pArray.setMap(null); 
            output = panelLayout(p.polygon, p.coordinates, Number(p.azimuthValue), p.orientationValue, p.rowSpaceValue, p.tiltValue, p.moduleWattage, p.panelLength, p.panelWidth);
            p.systemCapacity = output["s"];
            p.pArray = output["arr"];
            p.numPanels = output["numPanels"];
            p.latlngCenter = getPolygonCenter(p.coordinates);
            getEnergyProduction(p.latlngCenter, p.tiltValue, p.azimuthValue, p.systemCapacity, function(data) {
                p.energyProduction = data;
                selectPolygon(p);
            });

            google.maps.event.addListener(p.pArray, 'click', function () { selectPolygon(p); });
        })

        // listen for mouseover polygon event
        google.maps.event.addListener(p.polygon, "mouseover", function() {
            p.polygon.setOptions({fillColor: "orange",
                                  strokeColor: "orange"});
        })

        // listen for mouse out polygon event
        google.maps.event.addListener(p.polygon, "mouseout", function(event) {
            if(p.click_status == 0) // unselected
                p.polygon.setOptions({fillColor: "yellow",
                                  strokeColor: "yellow"});
            else // selected
                p.polygon.setOptions({fillColor: "green",
                                  strokeColor: "green"});
        })

        // update array upon parameter changes in control box
        updateSystemListener();

        // listener for sending an email report
        sendEmailReportListener();
    });
    
}

$(document).ready(function() {
    google.maps.event.addDomListener(window, 'load', initialize);

    $("#button-modal").click(function(){
        Show("modal-id");
    });

    //Fix modal mobile Boostrap 3
    function Show(id){
        //Fix CSS
        $(".modal-footer").css({"padding":"19px 20px 20px","margin-top":"15px","text-align":"right","border-top":"1px solid #e5e5e5"});
        $(".modal-body").css("overflow-y","auto");
        //Fix .modal-body height
        $('#'+id).on('shown.bs.modal',function(){
            $("#"+id+">.modal-dialog>.modal-content>.modal-body").css("height","auto");
            h1=$("#"+id+">.modal-dialog").height();
            h2=$(window).height();
            h3=$("#"+id+">.modal-dialog>.modal-content>.modal-body").height();
            h4=h2-(h1-h3);      
            if($(window).width()>=768){
                if(h1>h2){
                    $("#"+id+">.modal-dialog>.modal-content>.modal-body").height(h4);
                }
                $("#"+id+">.modal-dialog").css("margin","30px auto");
                $("#"+id+">.modal-dialog>.modal-content").css("border","1px solid rgba(0,0,0,0.2)");
                $("#"+id+">.modal-dialog>.modal-content").css("border-radius",6);               
                if($("#"+id+">.modal-dialog").height()+30>h2){
                    $("#"+id+">.modal-dialog").css("margin-top","0px");
                    $("#"+id+">.modal-dialog").css("margin-bottom","0px");
                }
            }
            else{
                //Fix full-screen in mobiles
                $("#"+id+">.modal-dialog>.modal-content>.modal-body").height(h4);
                $("#"+id+">.modal-dialog").css("margin",0);
                $("#"+id+">.modal-dialog>.modal-content").css("border",0);
                $("#"+id+">.modal-dialog>.modal-content").css("border-radius",0);   
            }
            //Aply changes on screen resize (example: mobile orientation)
            window.onresize=function(){
                $("#"+id+">.modal-dialog>.modal-content>.modal-body").css("height","auto");
                h1=$("#"+id+">.modal-dialog").height();
                h2=$(window).height();
                h3=$("#"+id+">.modal-dialog>.modal-content>.modal-body").height();
                h4=h2-(h1-h3);
                if($(window).width()>=768){
                    if(h1>h2){
                        $("#"+id+">.modal-dialog>.modal-content>.modal-body").height(h4);
                    }
                    $("#"+id+">.modal-dialog").css("margin","30px auto");
                    $("#"+id+">.modal-dialog>.modal-content").css("border","1px solid rgba(0,0,0,0.2)");
                    $("#"+id+">.modal-dialog>.modal-content").css("border-radius",6);               
                    if($("#"+id+">.modal-dialog").height()+30>h2){
                        $("#"+id+">.modal-dialog").css("margin-top","0px");
                        $("#"+id+">.modal-dialog").css("margin-bottom","0px");
                    }
                }
                else{
                    //Fix full-screen in mobiles
                    $("#"+id+">.modal-dialog>.modal-content>.modal-body").height(h4);
                    $("#"+id+">.modal-dialog").css("margin",0);
                    $("#"+id+">.modal-dialog>.modal-content").css("border",0);
                    $("#"+id+">.modal-dialog>.modal-content").css("border-radius",0);   
                }
            };
        });  
        //Free event listener
        $('#'+id).on('hide.bs.modal',function(){
            window.onresize=function(){};
        });  
        //Mobile haven't scrollbar, so this is touch event scrollbar implementation
        var y1=0;
        var y2=0;
        var div=$("#"+id+">.modal-dialog>.modal-content>.modal-body")[0];
        div.addEventListener("touchstart",function(event){
            y1=event.touches[0].clientY;
        });
        div.addEventListener("touchmove",function(event){
            event.preventDefault();
            y2=event.touches[0].clientY;
            var limite=div.scrollHeight-div.clientHeight;
            var diff=div.scrollTop+y1-y2;
            if(diff<0)diff=0;
            if(diff>limite)diff=limite;
            div.scrollTop=diff;
            y1=y2;
        });
        //Fix position modal, scroll to top.    
        $('html, body').scrollTop(0);
        //Show
        $("#"+id).modal('show');
    }

    //makes the map full-screen
    var view_side = document.getElementById(MYLIBRARY.getMapId());
    view_side.style.width = '100%';
    view_side.style.height = '100vh';
    view_side.style.position = 'absolute';
    view_side.style.height = 'auto';
    view_side.style.bottom = '0';
    view_side.style.top = '0';
    view_side.style.left = '0';
    view_side.style.right = '0';
    view_side.style.marginTop = '50px';
    document.getElementsByClassName('navbar')[0].style.marginBottom ='0px';

    //simulates onload click to activate modal
    eventFire(document.getElementById('button-modal'), 'click');

    //iniitalizes count variable for next/back button
    var count = 1;
    document.getElementById('next').onclick = next;
    document.getElementById('back').onclick = back;
    
    //displays the next instruction 
    function next(){
        document.getElementById(count).style.display = 'none';
        count += 1;
        document.getElementById('back').style.display = '';
        document.getElementById(count).style.display = 'block';
        if(count ==4){
            document.getElementById('next').style.display = 'none';
            document.getElementById('end').innerHTML = 'Get started!';
        }
    }
    //displays the previous instruction 
    function back(){
        document.getElementById(count).style.display = 'none';
        count -= 1;
        document.getElementById('next').style.display = '';
        document.getElementById(count).style.display = 'block';
        
    }

    //simulates click
    function eventFire(el, etype){
        if (el.fireEvent) {
            el.fireEvent('on' + etype);
        } else {
            var evObj = document.createEvent('Events');
            evObj.initEvent(etype, true, false);
            el.dispatchEvent(evObj);
        }
    }
});
