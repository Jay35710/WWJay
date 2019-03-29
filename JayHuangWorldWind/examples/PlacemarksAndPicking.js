/**
 * Copyright 2003-2006, 2009, 2017, United States Government, as represented by the Administrator of the
 * National Aeronautics and Space Administration. All rights reserved.
 *
 * The NASAWorldWind/WebWorldWind platform is licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Illustrates how to display and pick Placemarks.
 */
requirejs(['./WorldWindShim',
        './LayerManager'],
    function (WorldWind,
              LayerManager) {
        "use strict";
        // Tell WorldWind to log only warnings and errors.
        WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

        // Create the WorldWindow.
        var wwd = new WorldWind.WorldWindow("canvasOne");

        // Create and add layers to the WorldWindow.
        var layers = [
            // Imagery layers.
            {layer: new WorldWind.BMNGLayer(), enabled: true},
            {layer: new WorldWind.BingAerialLayer(), enabled: true},
            {layer: new WorldWind.BMNGLandsatLayer(), enabled: false},
            {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: false},
            // Add atmosphere layer on top of all base layers.
            {layer: new WorldWind.AtmosphereLayer(), enabled: true},
            // WorldWindow UI layers.
            {layer: new WorldWind.CompassLayer(), enabled: false},
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: false},
            {layer: new WorldWind.ViewControlsLayer(wwd), enabled: false},


        ];
        console.log(new WorldWind.ViewControlsLayer(wwd));


        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            wwd.addLayer(layers[l].layer);
        }

        // Define the images we'll use for the placemarks.
        var images = [
            "plain-black.png",
            "plain-blue.png",
            "plain-brown.png",
            "plain-gray.png",
            "plain-green.png",
            "plain-orange.png",
            "plain-purple.png",
            "plain-red.png",
            "plain-teal.png",
            "plain-white.png",
            "plain-yellow.png",
            "castshadow-black.png",
            "castshadow-blue.png",
            "castshadow-brown.png",
            "castshadow-gray.png",
            "castshadow-green.png",
            "castshadow-orange.png",
            "castshadow-purple.png",
            "castshadow-red.png",
            "castshadow-teal.png",
            "castshadow-white.png",
        ];

        var pinLibrary = WorldWind.configuration.baseUrl + "images/pushpins/", // location of the image files
            placemark,
            placemarkAttributes = new WorldWind.PlacemarkAttributes(null),
            highlightAttributes,
            placemarkLayer = new WorldWind.RenderableLayer("Placemarks"),
            latitude = 47.684444,
            longitude = -121.129722;

        // Set up the common placemark attributes.
        placemarkAttributes.imageScale = 1;
        placemarkAttributes.imageOffset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.3,
            WorldWind.OFFSET_FRACTION, 0.0);
        placemarkAttributes.imageColor = WorldWind.Color.GREEN;//WHITE;
        placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.5,
            WorldWind.OFFSET_FRACTION, 1.0);
        placemarkAttributes.labelAttributes.color = WorldWind.Color.YELLOW;
        placemarkAttributes.drawLeaderLine = true;
        placemarkAttributes.leaderLineAttributes.outlineColor = WorldWind.Color.RED;

        // For each placemark image, create a placemark with a label.
        for (var i = 0, len = images.length; i < len; i++) {
            // Create the placemark and its label.
            placemark = new WorldWind.Placemark(new WorldWind.Position(latitude, longitude + i, 1e2), true, null);
            placemark.label = "Placemark " + i.toString() + "\n"
                + "Lat " + placemark.position.latitude.toPrecision(4).toString() + "\n"
                + "Lon " + placemark.position.longitude.toPrecision(5).toString();
            placemark.altitudeMode = WorldWind.RELATIVE_TO_GROUND;

            // Create the placemark attributes for this placemark. Note that the attributes differ only by their
            // image URL.
            placemarkAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
            placemarkAttributes.imageSource = pinLibrary + images[i];
            placemark.attributes = placemarkAttributes;

            // Create the highlight attributes for this placemark. Note that the normal attributes are specified as
            // the default highlight attributes so that all properties are identical except the image scale. You could
            // instead vary the color, image, or other property to control the highlight representation.
            highlightAttributes = new WorldWind.PlacemarkAttributes(placemarkAttributes);
            highlightAttributes.imageScale = 1.2;
            placemark.highlightAttributes = highlightAttributes;

            // Add the placemark to the layer.
            placemarkLayer.addRenderable(placemark);
        }

        // Add the placemarks layer to the WorldWindow's layer list.
        wwd.addLayer(placemarkLayer);
        // Now set up to handle picking.
        ////////////////////////
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        ////////////////////////

        var highlightedItems = [];

        //The common pick-handling function.
        var handlePick = function (o) {
            // The input argument is either an Event or a TapRecognizer. Both have the same properties for determining
            // the mouse or tap location.
            var x = o.clientX,
                y = o.clientY;

            var redrawRequired = highlightedItems.length > 0; // must redraw if we de-highlight previously picked items

            // De-highlight any previously highlighted placemarks.
            for (var h = 0; h < highlightedItems.length; h++) {
                highlightedItems[h].highlighted = false;
            }
            highlightedItems = [];


            // Perform the pick. Must first convert from window coordinates to canvas coordinates, which are
            // relative to the upper left corner of the canvas rather than the upper left corner of the page.
            var pickList = wwd.pick(wwd.canvasCoordinates(x, y));
            if (pickList.objects.length > 0) {
                redrawRequired = true;
            }

            // Highlight the items picked by simply setting their highlight flag to true.
            if (pickList.objects.length > 0) {
                for (var p = 0; p < pickList.objects.length; p++) {
                    pickList.objects[p].userObject.highlighted = true;

                    // Keep track of highlighted items in order to de-highlight them later.
                    highlightedItems.push(pickList.objects[p].userObject);
                    // Detect whether the placemark's label was picked. If so, the "labelPicked" property is true.
                    // If instead the user picked the placemark's image, the "labelPicked" property is false.
                    // Applications might use this information to determine whether the user wants to edit the label
                    // or is merely picking the placemark as a whole.
                    if (pickList.objects[p].labelPicked) {
                        console.log("Label picked");
                    }
                }
            }

            // Update the window if we changed anything.
            if (redrawRequired) {
                wwd.redraw(); // redraw to make the highlighting changes take effect on the screen
            }

        };

        //Listen for mouse moves and highlight the placemarks that the cursor rolls over.
        wwd.addEventListener("mousemove", handlePick);

        //Listen for taps on mobile devices and highlight the placemarks that the user taps.
        var tapRecognizer = new WorldWind.TapRecognizer(wwd, handlePick);

        //Create a layer manager for controlling layer visibility.
        //var layerManager = new LayerManager(wwd);

////////////////////////
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
////////////////////////
        //create layer
        var placemarkCLayer = new WorldWind.RenderableLayer("∞∞∞∞∞∞∞∞∞∞∞");

        // Set up the common placemark attributes.
        var placemarkCAttributes = new WorldWind.PlacemarkAttributes(null);
        placemarkCAttributes.imageScale = 0.1;
        placemarkCAttributes.imageOffset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.0,
            WorldWind.OFFSET_FRACTION, 0.0);
        placemarkCAttributes.imageColor = WorldWind.Color.WHITE;//BLUE;
        placemarkCAttributes.labelAttributes.color = WorldWind.Color.WHITE;
        placemarkCAttributes.labelAttributes.offset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.5,
            WorldWind.OFFSET_FRACTION, 1.0);
        placemarkCAttributes.imageSource = WorldWind.configuration.baseUrl +"/images/Screen Shot 2019-01-09 at 4.03.10 PM.png";//"/image/charfat.jpg";// "/images/charfat.png";//



        //postion of placemark
        var positionC = new WorldWind.Position(23.47, 120.9575, 100.0, true, null);
        //////////////  23.4700° N, 120.9575° E
        //create the placemark
        var placemarkC = new WorldWind.Placemark(positionC, false, placemarkCAttributes);
        //create the label
        placemarkC.label = "∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞";
        // "Lat " + placemarkC.position.latitude.toPrecision(4).toString() + "\n" +
        // "Lon " + placemarkC.position.longitude.toPrecision(5).toString();
        placemarkC.alwaysOnTop = true;

        placemarkC.altitudeMode = WorldWind.RELATIVE_TO_GROUND;


        //add the placemark into the layer
        placemarkCLayer.addRenderable(placemarkC);

        placemarkC.altitudeMode = WorldWind.RELATIVE_TO_GROUND;

        highlightAttributes = new WorldWind.PlacemarkAttributes(placemarkCAttributes);
        highlightAttributes.imageScale = 0.3;
        placemarkC.highlightAttributes = highlightAttributes;


        // add the layer to the list
        wwd.addLayer(placemarkCLayer);
////////////////////////
// Create a pop up box//
//                    //
//                    //challenge 2
//                    //
//                    //
//                    //
//                    //
//                    //
// Create a pop up box//
//                    //
//                    //
//                    //
//                    //
////////////////////////
        //1. √create a box with content
        //2. make a function to response to the click
        //2.1 access picked object√
        //2.2 verify if it is a placemark if (pickedObject instanceof WorldWind.Placemark) {}√
        //2.3 display the box
        //3. add the box to an event listener to call the box
        //https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_modal

        var box = document.createElement("div");
        box.innerHTML = "<button id ='CharFatClose' >close</button><br><h1>CharJustFat</h1><p> JustCharFat!!!</p><br><img alt = 'CharFat' src='https://upload.wikimedia.org/wikipedia/commons/2/20/Common_lipids_lmaps.png' width='300px'>" +
            "<br><h2 style = 'font-size:70%'>source:https://en.wikipedia.org/wiki/Lipid</h2><img alt = 'char' src = 'https://qph.fs.quoracdn.net/main-raw-457280285-ymcqgsdumwxocugzufohaiiqrwoypzxb.jpeg' width = '300px'><br><h2 style = 'font-size:70%'>source:https://www.quora.com/profile/Charlie-Cai-16</h2>";
        box.id = "CharFat";
        document.body.appendChild(box);


        var CharFatClose = document.getElementById("CharFatClose");
        CharFatClose.id = "CharFatClose";

        //box.appendChild(CharFatClose);
        CharFatClose.onclick = function(){
            box.style.display = "none";
        };

        // function to response to the click

        var popUp = function(o){


            var x = o.clientX,
                y = o.clientY;

            for (var h = 0; h < highlightedItems.length; h++) {
                highlightedItems[h].highlighted = false;
            }

            var pickListCF = wwd.pick(wwd.canvasCoordinates(x, y));

            highlightedItems = [];

            if (pickListCF.objects.length > 0) {
                for (var p = 0; p < pickListCF.objects.length; p++) {
                    pickListCF.objects[p].userObject.highlighted = true;

                    // Keep track of highlighted items in order to de-highlight them later.
                    highlightedItems.push(pickListCF.objects[p].userObject);

                    // Detect whether the placemark's label was picked. If so, the "labelPicked" property is true.
                    // If instead the user picked the placemark's image, the "labelPicked" property is false.
                    // Applications might use this information to determine whether the user wants to edit the label
                    // or is merely picking the placemark as a whole.
                    if (pickListCF.objects[p].labelPicked) {
                        console.log("Label picked");
                    }
                    //console.log(pickListCF.objects[p].userObject instanceof  WorldWind.Placemark);// WorldWind.Placemark);


                    if(pickListCF.objects[p].userObject instanceof WorldWind.Placemark && pickListCF.objects[p].userObject.label === "∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞∞"  ){
                        box.style.display = "block";
                        console.log(placemarkCLayer);
                        //placemarkC2Layer.enabled =false;
                    }
                }
            }
        };


        wwd.addEventListener("click", popUp);


///////////////////////
//                    //Challenge 3
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
////////////////////////
        // 1. add another placemark in placemarkCLayer√√
        // 2. create another box with content√
        // 3. make a function respond to when mouse move to placemarkCC
        //3.1 access picked object√
        //3.2 filter out picked object except placemarkCC√
        //3.3 open the pop over
        // 4. eventListener√
        //https://www.w3schools.com/bootstrap/tryit.asp?filename=trybs_ref_js_popover_css&stacked=h
        //https://www.w3schools.com/bootstrap/bootstrap_popover.asp
        //https://www.w3schools.com/code/tryit.asp?filename=G16I8ZG2740V
        //https://www.w3schools.com/bootstrap/bootstrap_ref_js_popover.asp

        var placemarkCCAttributes = new WorldWind.PlacemarkAttributes(null);
        placemarkCCAttributes.imageScale = 0.3;
        placemarkCCAttributes.imageOffset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.0,
            WorldWind.OFFSET_FRACTION, 0.0);
        placemarkCCAttributes.imageColor = WorldWind.Color.WHITE;//BLUE;
        placemarkCCAttributes.labelAttributes.color = WorldWind.Color.WHITE;
        placemarkCCAttributes.labelAttributes.offset = new WorldWind.Offset(
            WorldWind.OFFSET_FRACTION, 0.5,
            WorldWind.OFFSET_FRACTION, 1.0);
        placemarkCCAttributes.imageSource = WorldWind.configuration.baseUrl +"//images/CharJustFat2.png";//"/image/charfat.jpg";// "/images/charfat.png";//

        var positionCC = new WorldWind.Position(90, 0 , 1000.0, true, null);
        //90.0000° N, 135.0000° W


        var placemarkCC = new WorldWind.Placemark(positionCC, false, placemarkCCAttributes);

        placemarkCC.label = "◊◊◊◊◊◊◊◊◊" ;
        // "Lat " + placemarkCC.position.latitude.toPrecision(4).toString() + "\n" +
        // "Lon " + placemarkCC.position.longitude.toPrecision(5).toString();
        placemarkCC.alwaysOnTop = true;

        placemarkCC.altitudeMode = WorldWind.RELATIVE_TO_GROUND;

        highlightAttributes = new WorldWind.PlacemarkAttributes(placemarkCCAttributes);
        highlightAttributes.imageScale = 0.5;
        placemarkCC.highlightAttributes = highlightAttributes;

        placemarkCLayer.addRenderable(placemarkCC);

        //create a box with content

        //<a href="#" title="Header" data-toggle="popover" data-trigger="hover" data-content="Some content">Hover over me</a>
        var charFatPop = document.createElement("div");
        charFatPop.innerHTML ='<a id ="charFatPop" href="https://www.cdc.gov/healthyschools/obesity/index.htm" title="CharFatFat" data-content="charJustFat" data-toggle="popover" data-trigger="hover" ></a>';
        console.log(charFatPop);
        //var charFatPopPop = document.querySelector("#charFatPopPop");
        document.body.appendChild(charFatPop);



        var popOverNew = function(o) {
            var x = o.clientX,
                y = o.clientY;

            for (var h = 0; h < highlightedItems.length; h++) {
                highlightedItems[h].highlighted = false;

                var pickListCF = wwd.pick(wwd.canvasCoordinates(x, y));

                highlightedItems = [];

                if (pickListCF.objects.length > 0) {
                    for (var p = 0; p < pickListCF.objects.length; p++) {
                        pickListCF.objects[p].userObject.highlighted = true;

                        // Keep track of highlighted items in order to de-highlight them later.
                        highlightedItems.push(pickListCF.objects[p].userObject);
                        if (pickListCF.objects[p].userObject instanceof WorldWind.Placemark && pickListCF.objects[p].userObject.label === "◊◊◊◊◊◊◊◊◊" ) {
                            console.log("fat");
                            $('[data-toggle="popover"]').popover('show');

                        }else {
                            $('[data-toggle="popover"]').popover('hide');
                        }
                    }
                }
            }
        };

        wwd.addEventListener("mousemove", popOverNew);

////////////////////////
//                    //challenge 4
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
////////////////////////
        //bootstrap toggle switch: https://mdbootstrap.com/docs/jquery/forms/switch/
        //accordion example: https://usgs.aworldbridgelabs.com/mapsvcviewer
        //w3school: https://www.w3schools.com/bootstrap/bootstrap_collapse.asp
        //multi level accordion: https://codepen.io/marklsanders/pen/OPZXXv?editors=1000
        //try it editor: https://www.w3schools.com/code/tryit.asp?filename=G1SLBN9U9IQF



        var slider1 = document.getElementById("slider1");
        var LayerToggle= function(){
            if(placemarkCLayer.enabled === true){
                slider1.onclick=function () {
                    placemarkCLayer.enabled = false

                }
            }
            if (placemarkCLayer.enabled === false){
                slider1.onclick=function(){
                    placemarkCLayer.enabled = true
                }
            }
        };
        addEventListener("click", LayerToggle);

        var slider2 = document.getElementById("slider2");
        var LayerToggle2= function(){
            if(placemarkCLayer.enabled === true){
                slider2.onclick=function () {
                    placemarkCLayer.enabled = false

                }
            }
            if (placemarkCLayer.enabled === false){
                slider2.onclick=function(){
                    placemarkCLayer.enabled = true
                }
            }
        };
        addEventListener("click", LayerToggle2);

        ////////////////////////
        //                    //challenge 5
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        ////////////////////////

            //  http://cs.aworldbridgelabs.com:8080/geoserver/web/
            //  http://aworldbridgelabs.com:8080/geoserver/FatWMS/wms?service=WMS&version=1.1.0&request=GetMap&layers=FatWMS:pointlands&styles=&bbox=-105.370531,39.914352,-105.065309,40.217396&width=768&height=762&srs=EPSG:4269&format=application/openlayers
            // Web Map Service information from NASA's Near Earth Observations WMS
        //var serviceAddress = "./data/FatWMS.js";
        // var serviceAddress = "https://neo.sci.gsfc.nasa.gov/wms/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0";
            var serviceAddress = "http://cs.aworldbridgelabs.com:8080/geoserver/ows?service=wms&version=1.3.0&request=GetCapabilities";
            // Named layer displaying Average Temperature data
            var layerName = "FatWMS:pointlands";
            // Called asynchronously to parse and create the WMS layer
            var createLayer = function (xmlDom) {
                // Create a WmsCapabilities object from the XML DOM
                var wms = new WorldWind.WmsCapabilities(xmlDom);
                console.log(wms);
                // Retrieve a WmsLayerCapabilities object by the desired layer name
                var wmsLayerCapabilities = wms.getNamedLayer(layerName);
                console.log(wmsLayerCapabilities);
                // Form a configuration object from the WmsLayerCapability object
                var wmsConfig = WorldWind.WmsLayer.formLayerConfiguration(wmsLayerCapabilities);
                // Modify the configuration objects title property to a more user friendly title
                wmsConfig.title = "øøøøøøøøø";
                // Create the WMS Layer from the configuration object
                var wmsLayer = new WorldWind.WmsLayer(wmsConfig);

                // Add the layers to WorldWind and update the layer manager
                wwd.addLayer(wmsLayer);
                layerManager.synchronizeLayerList();
                wmsLayer.enabled = true;
                console.log("char");
                var slider3 = document.getElementById("slider3");
                var LayerToggle3 = function () {
                    if (wmsLayer.enabled === true) {
                        slider3.onclick = function () {
                            wmsLayer.enabled = false

                        }
                    }
                    if (wmsLayer.enabled === false) {
                        slider3.onclick = function () {
                            wmsLayer.enabled = true
                        }
                    }
                };
                addEventListener("click", LayerToggle3);

                var slider4 = document.getElementById("slider4");
                var LayerToggle4 = function () {
                    if (wmsLayer.enabled === true) {
                        slider4.onclick = function () {
                            wmsLayer.enabled = false

                        }
                    }
                    if (wmsLayer.enabled === false) {
                        slider4.onclick = function () {
                            wmsLayer.enabled = true
                        }
                    }
                };
                addEventListener("click", LayerToggle4);
            };

            // Called if an error occurs during WMS Capabilities document retrieval
            var logError = function (jqXhr, text, exception) {
                console.log("There was a failure retrieving the capabilities document: " + text + " exception: " + exception);
            };


            $.get(serviceAddress).done(createLayer).fail(logError);


        //toggle the layer


        ////////////////////////
        //                    //
        //Create              //
        //custom              //
        //                    //
        //    placemark2      //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        ////////////////////////

        // Create the custom image for the placemark with a 2D canvas.
        var canvas = document.createElement("canvas"),
            ctx2d = canvas.getContext("2d"),
            size = 640, c = size / 2 - 0.5, innerRadius = 10, outerRadius = 40;
        //onsole.log(c);
        canvas.width = size;
        canvas.height = size;

        var gradient = ctx2d.createRadialGradient(c, c, innerRadius, c, c, outerRadius);
        gradient.addColorStop(0, 'rgb(0, 0, 0)');
        gradient.addColorStop(0.5, 'rgb(255, 255, 255)');
        gradient.addColorStop(1, 'rgb(0, 0, 0)');

        ctx2d.fillStyle = gradient;
        ctx2d.arc(c, c, outerRadius, 0, 2 * Math.PI, false);
        ctx2d.fill();

        // Set placemark attributes.
        var placemarkC2Attributes = new WorldWind.PlacemarkAttributes(null);
        // Wrap the canvas created above in an ImageSource object to specify it as the placemarkAttributes image source.
        placemarkC2Attributes.imageSource = new WorldWind.ImageSource(canvas);
        // Define the pivot point for the placemark at the center of its image source.
        placemarkC2Attributes.imageOffset = new WorldWind.Offset(WorldWind.OFFSET_FRACTION, 0.5, WorldWind.OFFSET_FRACTION, 0.5);
        placemarkC2Attributes.imageScale = 1;
        placemarkC2Attributes.imageColor = WorldWind.Color.WHITE;

        // Set placemark highlight attributes.
        // Note that the normal attributes are specified as the default highlight attributes so that all properties
        // are identical except the image scale. You could instead vary the color, image, or other property
        // to control the highlight representation.
        var highlightC2Attributes = new WorldWind.PlacemarkAttributes(placemarkC2Attributes);
        highlightC2Attributes.imageScale = 1.2;

        // Create the placemark with the attributes defined above.
        var positionC2 = new WorldWind.Position(25.033, 121.564, 1e2);
        var placemarkC2 = new WorldWind.Placemark(positionC2, false, placemarkC2Attributes);
        // Draw placemark at altitude defined above, relative to the terrain.
        placemarkC2.altitudeMode = WorldWind.RELATIVE_TO_GROUND;
        // Assign highlight attributes for the placemark.
        placemarkC2.highlightAttributes = highlightC2Attributes;

        // Create the renderable layer for placemarks.
        var placemarkC2Layer = new WorldWind.RenderableLayer("§§§§§§§§§§§§");

        // Add the placemark to the layer.
        placemarkC2Layer.addRenderable(placemarkC2);

        // Add the placemarks layer to the WorldWindow's layer list.
        wwd.addLayer(placemarkC2Layer);

        // Now set up to handle highlighting.
        var highlightController = new WorldWind.HighlightController(wwd);

        ////////////////////////
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        //                    //
        ////////////////////////
        // Create a layer manager for controlling layer visibility.
        var layerManager = new LayerManager(wwd);
    });

//////////////////////////////                     ////                                                                                                                                                                                        //
//////////////////////////////                    ////                                                                                                                                                                                         //
////                                 ////                                                                                                                                                                  //
////                                ////                                                                                                                                                                   //
////                               ////                                                                                                                                                                    //
////                              ////                                                                                                                                                                     //
////                             ////                                                                                                                                                                      //
////                            ////                                                                                                                                                                       //
////                           ////                                                                                                                                                                        //
////                          ////                                                                                                                                                                         //
////                         ////                                                                                                                                                                          //
////                        ////                                                                                                                                                                           //
////                       ////                                                                                                                                                                            //
/////        ////                                                                                                                                                                                                 //
/////       ////                                                                                                                                                                                                  //
//////////////                                                                                                                                                                                                       //
////////////                                                                                                                                                                                                       //
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

////////////////////////
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
//                    //
////////////////////////
// console.log("");