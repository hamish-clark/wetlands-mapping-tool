/*---------------------------
----- Config Vars: Change these to configure for your city or cities-------------
---------------------------*/
var myCities = [  //NAME AND BOUNDS OF CITIES 
    {name:"Wellington",bnds:[[-41.253351,174.713348],[-41.356514,174.846820]]}
  ]

carto_table_name = "wetlands" // cartoDB table name
carto_username = "bentleyshannon" // your cartoDB username

carto_apikey = "" // Enter Carto API key here.

  ,brandText = "Welly's Neighbourhoods: Have your say!" // top left text and link on site
  ,brandLink = "https://www.wellyhoods.com" //top left link on site
  ,giturl = "https://github.com/hamish-clark/wetlands-mapping-tool" //Only change this if you want to link to a fork you made, otherwise you can leave the link to the original repo
  ,twiturl = "" //Links to my twit acct, change it if you want or remove twitter link altogether
  
  /*---------------------------
  ----- Application Vars -------------
  ---------------------------*/
  
  var selectedCity = myCities[0]//selected city defaults to first myCities city.
  ,map
  ,freeDrawLayer
  ,highlightHoods=[]
  ,highlightCount = 0
  ,c = new L.Control.Zoom({position:'topright'})
  ,lg = new L.layerGroup()
  ,overlg = new L.layerGroup()
  ,getJSON = {abort: function () {}}
  
  ,ajaxrunning = false
  ,flagIndex = null
  ,poly
  ,marker
  ,geomType
  ,drawnItems
  ,hoodCoords = '' 
  ,pointCoords = ''
  ,participantAge = 999
  ,genderClass = 999
  ,nbrhdYears = 999 
  ,haveChildren = 999 
  ,haveChildrenHome = 999
  ,haveChildrenSchool = ""
  ,carAccess = 999
  ,carAccessDrive = 999
  ,carUse = 999
  ,publicUse = 999
  ,cycleUse = 999
  ,walkUse = 999
  ,hStyle = {
      "stroke":true,
      "color":"#cd0000",//data.rows[i].strokeColor,
      "weight":2,
      "opacity":1,
      "fill":false,
      "clickable":false
  }
  //fill array from color brewer
  //,fillArr = ['#8DD3C7','#FFED6F','#BEBADA','#FB8072','#80B1D3','#FDB462','#B3DE69','#FCCDE5','#D9D9D9','#BC80BD','#CCEBC5','#FFFFB3']
  //fill array from tools.medialab.sciences-po.fr/iwanthue/index.php
  ,fillArr = ["#E7C265","#8AD4E2","#ECACC1","#95D18F","#E9D5B3","#E1EF7E","#F69D92","#9CD7BF","#B2BD75","#D1D3CF","#DAC1E1","#B3C69F","#D1AB6D","#E9D898","#B0CBE6","#D9B5AB","#86E9E1","#DBEA97","#D1F1E4","#DDEBBB","#DFB991","#F3AD8E","#8CDEB5","#EDAF69","#B9F2A6","#8DC8C4","#C2E887","#E5D670","#EAD483","#C4BF6A"]

  ,toner = L.tileLayer('https://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
      attribution: '<a href="https://stamen.com/" target="_blank" >Stamen</a> | &copy; <a href="http://openstreetmap.org/" target="_blank" >OpenStreetMap</a> contributors'
  })

  sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    zIndex: 50
  })

  mapb = L.tileLayer('https://api.mapbox.com/styles/v1/rickarhayd1910/cjw7aiame4jon1cpif3ajqspp/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoicmlja2FyaGF5ZDE5MTAiLCJhIjoiY2p3NzV3OW0zMjg0dzQ5cHN3cHA0OTEwbiJ9.FNRLdU0b4MtTA_W5eo5ltQ', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>', zIndex: 10
  })

  label_layer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {zIndex : 100})

  ,instructed={};
  
  /*---------------------------
  ----- $(window).load -------
  ---------------------------*/
  function go(){

    $( 'body' ).attr('class','make');
    $('#deletePolyBtn').hide();
    $('#submitPolyBtn').hide();
    $('.modal-body').css( 'max-height', window.innerHeight - 180 );

    map = new L.Map('map', {
      zoomControl:false,
      center: [0,0],
      zoom: 10.74,
      editable: true,
      layers: [label_layer, sat]
    });

    // map.on("zoomend", (e) => {
    //   console.log(e);
    //   let zoom_level = e.target._zoom;
    //   if (zoom_level >= 15){
    //     sat.setOpacity(1);
    //     sat.addTo(map);
    //   }else{
    //     sat.setOpacity(0);
    //     mapb.addTo(map);
    //   }
    // })

    map.on("baselayerchange", (e) => {
      let navDiv = document.getElementById("navDiv")
      navDiv.classList.toggle("navbar-inverse");
      if (e.name === "Street map"){
        label_layer.setOpacity(0);
      }else{
        label_layer.setOpacity(1);
      }
    });


    //https://www.arcgis.com/home/item.html?id=413fd05bbd7342f5991d5ec96f4f8b18


    var baseMaps = {
      "Aerial Imagery": sat,
      "Street map":mapb
    };
    
    
    let l =  L.control.layers(baseMaps, {}, {collapsed:false, "autoZIndex":true})
    
    label_layer.addTo(map)

    c.addTo(map);
    l.addTo(map);
    
    lg.addTo(map);

    overlg.addTo(map);

    
    //map.fitBounds(selectedCity.bnds);
    map.setView([-41.0797201, 175.4799973],11)
  
    //draw controls
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    showInstructions();
    
     
      //-----------------------------END DRAW CONTROLS---------------------------------------
  
      //make teh nav and city buttons---------------|<>o|----thhppt---------City buttons Y'All!
    
    //add listeners------------------------------------------------------------------------------------------------------LIsteners Y'All!
    $('#aboutModal').modal('show').on('hidden.bs.modal',function(){
    showInstructions();
    })

    $("#resultMapBtn").click(function(e){ });

    $('#resultsInSpace').click (
      function (e) {
        mapBackground = !$('#resultsInSpace').hasClass('active');
        if(!$('#resultsInSpace').hasClass('active')){
          toner.setOpacity(0);
          sat.setOpacity(0);
        }else{
          toner.setOpacity(1);
          sat.setOpacity(1);
        }
    });
    $("#flagBtn").on('click',function(){
      $('#flagModal').modal('hide');
      $('.flag-btn[name="' + flagIndex + '"]').addClass('flagged');
      postData( "php/flag.php",{
        id: flagIndex
      });
    });
    $("#downloadBtn").on('click',function(){
      window.open(
        
      );
      $('#downloadModal').modal('hide');
    });
    $("#accordion").slimScroll({ height:'100%', position: 'left', distance:0, railcolor:'#ffffff', color:'#555555'});
  
    $('#startPolyBtn').on('click',function(){
      geomType = "poly";
      $('#deletePolyBtn').show();
      $('#startPolyBtn').hide();
      $('#submitPolyBtn').hide();
      $('#startMarkerBtn').hide();
      drawnItems.eachLayer(function(l){
        if ( l.setStyle ) l.setStyle({clickable:false});
      });
      if ( !instructed.poly ){
        showDrawingInstructions();
        return;
      } 
      freeDrawLayer = new L.FreeDraw({mode: L.FreeDraw.MODES.ALL })
        .on( 'created', function(e){
          var originalPoly = this.polygons[0];
          poly = L.polygon( originalPoly.getLatLngs(), {color:'#D7217E',fillColor:'#D7217E'} );
          map.removeLayer( originalPoly );
          map.removeLayer(freeDrawLayer);
          freeDrawLayer = undefined;
          drawnItems.addLayer( poly );
          poly.enableEdit();
          $(".leaflet-container").removeClass("drawing");
          $('#submitPolyBtn').show();
          showEditingInstructions();
        })
      map.addLayer(freeDrawLayer);
      $(".leaflet-container").addClass("drawing");
    });
  
    $('#deletePolyBtn').on('click',function(){
      if ( poly ) drawnItems.removeLayer( poly );
      if ( marker ) drawnItems.removeLayer( marker );
      poly = undefined;
      marker = undefined;
      if ( freeDrawLayer ){
        map.removeLayer(freeDrawLayer);
        freeDrawLayer = undefined;
        map.dragging.enable();
        $(".leaflet-container").removeClass("drawing");
      }
      $('#submitPolyBtn').hide();
      $('#submitCenterBtn').hide();
      $('#startPolyBtn').show();
      $('#startMarkerBtn').show();
      $('#deletePolyBtn').hide();
      drawnItems.eachLayer(function(l){
        if ( l.setStyle ) l.setStyle({clickable:false});
      });
       map.off("editable:editing").off("editable:drawing:commit");
    });
   
    $('#startMarkerBtn').on('click',function(){
      geomType = "point";
      $('#deletePolyBtn').show();
      $('#startPolyBtn').hide();
      $('#submitPolyBtn').hide();
      $('#startMarkerBtn').hide();
      marker = map.editTools.startMarker();
      drawnItems.addLayer( marker );
      showDrawingInstructions();
      map.on("editable:editing",function(){
        $(".leaflet-container").removeClass("drawing");
        $('#submitPolyBtn').show();
      }).on("editable:drawing:commit",function(){
        showEditingInstructions();
        $(".leaflet-container").removeClass("drawing");
        $('#submitPolyBtn').show();
      });
    })
  
    $("#submitPolyBtn").click(function(e){
      geomType = "point";
      $('#deletePolyBtn').show();
      $('#startPolyBtn').hide();
      //$('#submitPolyBtn').hide();
      $('#startMarkerBtn').hide();
      $("#submitModal").modal('show');
      // marker = map.editTools.startMarker();
      // drawnItems.addLayer( marker );
      // //showDrawingInstructions();
      // map.on("editable:editing",function(){
      //   $(".leaflet-container").removeClass("drawing");
      //   $('#submitCenterBtn').show();
      // }).on("editable:drawing:commit",function(){
      //   showEditingInstructions();
      //   $(".leaflet-container").removeClass("drawing");
      //   $('#submitCenterBtn').show();
      // });
    })
    
    $("#submitCenterBtn").click(function(e){
      if(checkWithin(marker, poly) == false){
        alert("Please place the marker inside the neighbourhood you drew")
      }
      else{
        $("#submitModal").modal('show');
      }
    });
    $(".gnd-group > button.btn").on("click", function(){ // GENDER
      num = this.name;
      genderClass = num;
    });
    $(".nbr-group > button.btn").on("click", function(){ // LENGTH IN HOOD
      num = this.name;
      nbrhdYears = num;
    });
    $(".children-group > button.btn").on("click", function(){ // HAVE CHILDREN
      num = this.name;
      haveChildren = num;
    });
    $(".childrenhome-group > button.btn").on("click", function(){ // CHILDREN AT HOME
      num = this.name;
      haveChildrenHome = num;
    });
    $("#preschool").change(function() {
        if($(this).prop('checked')) {
            num = this.name;
            haveChildrenSchool = haveChildrenSchool.concat(num)
        }
        else{
          haveChildrenSchool = haveChildrenSchool.replace("preschool","")
        }
      });
      $("#primary").change(function() {
        if($(this).prop('checked')) {
            num = this.name;
            haveChildrenSchool = haveChildrenSchool.concat(num)
        }
        else{
          haveChildrenSchool = haveChildrenSchool.replace("primary","")
        }
      });
      $("#intermediate").change(function() {
        if($(this).prop('checked')) {
            num = this.name;
            haveChildrenSchool = haveChildrenSchool.concat(num)
        }
        else{
          haveChildrenSchool = haveChildrenSchool.replace("intermediate","")
        }
      });
      $("#secondary").change(function() {
        if($(this).prop('checked')) {
            num = this.name;
            haveChildrenSchool = haveChildrenSchool.concat(num)
        }
        else{
          haveChildrenSchool = haveChildrenSchool.replace("secondary","")
        }
      });
      $("#post").change(function() {
        if($(this).prop('checked')) {
            num = this.name;
            haveChildrenSchool = haveChildrenSchool.concat(num)
        }
        else{
          haveChildrenSchool = haveChildrenSchool.replace("post","")
        }
      });
    $(".caraccess-group > button.btn").on("click", function(){ // CAR ACCESS
      num = this.name;
      carAccess = num;
    });
    $(".candrive-group > button.btn").on("click", function(){ // CAN DRIVE CAR
      num = this.name;
      carAccessDrive = num;
    });
    $(".car-group > button.btn").on("click", function(){ // CAR
      num = this.name;
      carUse = num;
    });
    $(".public-group > button.btn").on("click", function(){ // PUBLIC TRANSPORT
      num = this.name;
      publicUse = num;
    });
    $(".cycle-group > button.btn").on("click", function(){ // CYCLE
      num = this.name;
      cycleUse = num;
    });
    $(".walk-group > button.btn").on("click", function(){ // WALK
      num = this.name;
      walkUse = num;
    });
  
    function add_wetland(){
      //CHECK IF community group has a name
      if (!notEmptyText(document.getElementById('hoodName'))){
        alert('Please enter a Community group name, thanks.');  
        return false;
      }; 
      
      //CHECK IF wetland has a name
      if (!notEmptyText(document.getElementById('wetlandName'))){
        alert('Please enter a name for the wetland you drew, thanks.');  
        return false;
      }; 

      let communityGroup = document.getElementById('hoodName').value;
      let wetlandName = document.getElementById('wetlandName').value;

      //participantAge = document.getElementById('optionAge').value;
      document.getElementById('hoodName').value = '';
      document.getElementById('wetlandName').value = '';
      $('#deletePolyBtn').hide();
      $('#submitCenterBtn').hide();
      $('#startPolyBtn').show();
      $('#startMarkerBtn').show();
      $("#submitModal").modal('hide');
      $(".gnd-group > button.btn").removeClass('active');
      $(".nbr-group > button.btn").removeClass('active');
      $(".children-group > button.btn").removeClass('active');
      $(".childrenhome-group > button.btn").removeClass('active');
      $(".childrenschool-group > button.btn").removeClass('active');
      $(".caraccess-group > button.btn").removeClass('active');
      $(".candrive-group > button.btn").removeClass('active');
      $(".car-group > button.btn").removeClass('active');
      $(".public-group > button.btn").removeClass('active');
      $(".cycle-group > button.btn").removeClass('active');
      $(".walk-group > button.btn").removeClass('active');


      hoodCoords = ''

      var a = poly.getLatLngs();
        for (var i = 0; i < a.length; i++) {
          var lat = (a[i].lat);//.toFixed(4); // rid of rounding that was there for url length issue during dev
          var lng = (a[i].lng);//.toFixed(4); // rid of rounding that was there for url length issue during dev
          hoodCoords += '['+lng + ',' + lat+'],';
        if(i==a.length-1){
          var lat = (a[0].lat).toFixed(4);
            var lng = (a[0].lng).toFixed(4);
          hoodCoords += '['+lng + ',' + lat+']';
        }
      }

      poly
        .setStyle({color:'#03f',fillColor:'#03f',weight:2,fillOpacity:.1})
        .bindPopup(communityGroup)
        .disableEdit();
      poly = undefined;

      // tableExt = "_point"
      //   pointCoords = '[' + marker.getLatLng().lng + ',' + marker.getLatLng().lat + ']';
      //   marker.bindPopup("Focal Point of " +currentHood)
      //     .disableEdit();
      //   marker = undefined;
      
      map.off("editable:editing").off("editable:drawing:commit");

      drawnItems.eachLayer(function(l){
        if ( l.setStyle ) l.setStyle({clickable:false});
      });
      $('#submitPolyBtn').hide();

      let timeStamp =  new Date().getTime();
      
      console.log(wetlandName)
      console.log(communityGroup)
      console.log(hoodCoords)
      console.log(timeStamp)

      // let sql_query = `SELECT * FROM ${carto_table_name}`;
      let sql_query = `INSERT INTO ${carto_table_name} (point_array_string, wetland_name, group_name, timestamp) VALUES ('${hoodCoords}', '${wetlandName}', '${communityGroup}', '${timeStamp}');`;
      
      // sql_query = `SELECT * FROM ${carto_table_name};`

      let url = `https://${carto_username}.carto.com/api/v2/sql?q=${sql_query}&api_key=${carto_apikey}`
      console.log(url);

      fetch(url, {mode : 'no-cors'})
        // .then( (response) => { console.log(response); return response.json(); })
        // .then( (json) => { console.log(json); })

      return true; // Succesfully added a wetland

    }

    $("#addWetlandBtn").click(function(e){
      add_wetland();


    });

    $("#allSubmitBtn").click(function(e){
      if (add_wetland()){
        $("#thanksModal").modal('show');
      }
    });

    $("#thanksBtn").click(function(e){
      
      $("#thanksModal").modal('hide');
    });  
  
    $(".enableTooltipsLeft").tooltip({container:"body",placement:"left"});
    if(window.location.hash) {
      if(window.location.hash.substr(1)==="view"){
        $('#resultMapBtn').addClass('active');
        $('#makeMapModeBtn').removeClass('active');
        goViewState();
      }
    } else {
      // Fragment doesn't exist so, what are ya gonna do?
    }
  }
  
  /*---------------------------
  ----- Some Functions -------------
  ---------------------------*/
  
  var checkWithin = function(marker, poly) {
    var polyPoints = poly.getLatLngs();       
    var x = marker.getLatLng().lat, y = marker.getLatLng().lng;
  
    var inside = false;
    for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
        var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
        var xj = polyPoints[j].lat, yj = polyPoints[j].lng;
  
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
  
    return inside;
  };
  
  function notEmptyText(elem){
    if(elem.value.length == 0){
      elem.focus(); // set the focus to this input
      return false;
    }
    return true;
  }
  
  var clearHighlightedHood = function(idx){
    highlightCount--;
    $( "."+idx+"" ).remove();
    var lyrs = highlightHoods[idx].layers;
    highlightHoods[idx].name = '';
    for(var l=0;l<lyrs.length;l++){
      overlg.removeLayer(lyrs[l]);
    }
    //todo shift color to end start of fill array
    var find = highlightHoods[idx].fillColor;
    for(var i = 0;i<fillArr.length;i++){
      //console.log(find + '?' + fillArr[i]);
      if(fillArr[i]===find){
        console.log('found')
        element = fillArr[i];
        fillArr.unshift(fillArr.splice(i, 1));
      }
    }
    resizeHandler();
  }
  var resizeHandler = function(){
    vph = $(window).height();
    //var position = $('#descriptionDiv').position().top;
    //contentHeight = $('#accordion')[0].scrollHeight;
    }
    
  var postData = function(url,data){
    if ( !url || !data ) return;
    data.cache = false;
    data.timeStamp = new Date().getTime()
    $.post(url,
      data, function(d) {
        console.log(d);
      });
  }
  
  var animateHeart = function(ex,wy){
    $("#loveIcon").css({left:ex-10,top:wy-10,opacity:1,width:20,height:20});
    $( "#loveIcon" ).animate({
      top: '-=' + $("#loveIcon").height()/2,
      left: '-=' + $("#loveIcon").width()/2,
      width: $("#loveIcon").width()*2,
      height: $("#loveIcon").height()*2,
      opacity: 0
    }, 600 );
  }
  var goMakeState = function(){
    $('body').attr('class','make');
    $('.viewMap').fadeOut('fast', function() {
      $('#btnBar').fadeIn('fast', function() {
      });
    });
    
    if($('#resultsInSpace').hasClass('active')){
      $('#resultsInSpace').button('toggle');
      
    };
    mapBackground = false;
    toner.setOpacity(1);
    sat.setOpacity(1);
    lg.clearLayers();
    map.addLayer( drawnItems );
  
    if ( poly ) drawnItems.removeLayer( poly );
    if ( marker ) drawnItems.removeLayer( marker );
    poly = undefined;
    marker = undefined;
    if ( freeDrawLayer ){
      map.removeLayer(freeDrawLayer);
      freeDrawLayer = undefined;
      map.dragging.enable();
      $(".leaflet-container").removeClass("drawing");
    }
  
    clearSomeHoods(highlightCount);
    $('#deletePolyBtn').hide();
    $('#startPolyBtn').show();
    $('#startMarkerBtn').show();
    $('#submitPolyBtn').hide();
  
    if ( !instructed ) showBasemapInstructions();
  }
  /*-----------------------------------------
  ---------UI helper stuff
  -------------------------------------------*/
  function showInstructions(){
    if ( instructed.poly && instructed.point ) return;
    var action = L.Browser.touch ? 'tap' : 'click';
    var title = 'Draw your Wetland!',
      text = 'To get started, zoom to your area of interest, then ' + action + ' the <b>Draw your Wetland </b> button in the <b>top left</b> of your screen. You can also change the interactive map of Wairarapa by clicking on the <b>Layers Icon</b> (beneath the + and - icons).'
      src = 'img/new_instructions_1.gif';
    showAlert( title, text, src );
  }

  function showDrawingInstructions(){
    if ( instructed[geomType] ) return;
    if ( geomType == "poly" ){
      var action = L.Browser.touch ? 'Drag your finger' : 'Click and drag your mouse';
      var title = 'Now trace the boundary of your wetland',
        text = action + ' to draw the shape of the wetland. You won\'t be able to move the map while drawing, but don\'t worry, you can make changes after you finish.',
        src = 'img/new_instructions_2.gif';
      showAlert( title, text, src );
      function enableDrawing(){
        freeDrawLayer = new L.FreeDraw({mode: L.FreeDraw.MODES.ALL })
          .on( 'created', function(e){
            var originalPoly = this.polygons[0];
            poly = L.polygon( originalPoly.getLatLngs(), {color:'#D7217E',fillColor:'#D7217E'} );
            map.removeLayer( originalPoly );
            map.removeLayer(freeDrawLayer);
            freeDrawLayer = undefined;
            drawnItems.addLayer( poly );
            poly.enableEdit();
            $(".leaflet-container").removeClass("drawing");
            $('#submitPolyBtn').show();
            showEditingInstructions();
          })
        map.addLayer(freeDrawLayer);
        $(".leaflet-container").addClass("drawing");
        $('#generalModal').off('hide.bs.modal',enableDrawing)
      }
      $('#generalModal').on('hide.bs.modal',enableDrawing)
    } else {
      var action = L.Browser.touch ? 'Drag your finger' : 'Click and drag your mouse';
      var title = 'Now place the marker to where you consider the <b>Focal Point</b> of the neighbourhood you drew is',
        text = L.Browser.touch ? 'Drag the marker to the desired location, then tap to drop the marker.'
          : 'Move your mouse to the desired location, then click to drop the marker.'
        src = L.Browser.touch ? 'img/new_instructions_4.gif' : 'img/new_instructions_4.gif';
        if ( L.Browser.touch ) instructed[geomType] = true;
      showAlert( title, text, src );
    }
    
  }

  function showEditingInstructions(){
    if ( instructed[geomType] ) return;
    instructed[geomType] = true;
    if ( geomType == "poly" ){
      var action = L.Browser.touch ? 'tap' : 'click';
      var title = 'Looking good',
        text = 'You can now adjust the shape of the wetland. Drag the white squares to change the shape, or ' + action + ' them to delete corners. Press <b>Save Boundary</b> to continue.',
        src = 'img/new_instructions_3.gif';
      showAlert( title, text, src );
    } else {
      if ( L.Browser.touch ) return;
      var title = 'Looking good',
        text = 'You can click and drag the marker to edit its location. When you are satisfied, press <b>Save Focal Point</b>.',
        src = 'img/new_instructions_5.gif';
      showAlert( title, text, src );
    }
  }
  
  function showAlert( title, text, imageSrc, buttonLabel ){
    var m = $("#generalModal");
    $('.modal-body', m).empty();
  
    $('h3',m).html(title);
    
    if ( imageSrc ){
      $('<div class="img-container">')
        .html('<img src="'+imageSrc+'">')
        .appendTo( $('.modal-body', m) );
    }
  
    $('<p>')
      .html(text)
      .appendTo( $('.modal-body', m) );
  
    buttonLabel = buttonLabel || 'OK';
    $('.btn-default',m).html(buttonLabel);
  
    m.modal('show');
  }
  
  /*-----------------------------------------
  ---------Hey, Listeners! Lookout behind you! |o| |<{}>| |o| 
  -------------------------------------------*/
  $('.mapState').click(function() {
          $('.mapState').removeClass('active');
          $(this).addClass('active');
  });
  $("#makeMapModeBtn").click(function(e){
      goMakeState();
  });
  $("#githubBtn").click(function(e){
    window.open(giturl, '_blank');
  });
  $("#twitterBtn").click(function(e){
    window.open(twiturl, '_blank');
  });
  $("#modalInfoBtn").click(function(e){
    window.open(brandLink, '_blank');
  });
  //kludge for stupid bootstrap btn group conflict I couldn't figure out.
  $('.btn-group button').click(function()
  {
      $(this).parent().children().removeClass('active');
      $(this).addClass('active');
  });
  $(document).on('click', ".highlightedHood-btn", function() {
    var removeIndex = $(this).attr("id");
    clearHighlightedHood(removeIndex);
  });
  $(document).on('click',".download-btn",function(){
    $('#downloadModal').modal('show');
  });
  $(document).on('click',".flag-btn",function(){
    flagIndex = $(this).attr("name");
    $('#flagModal').modal('show');
  
  });
  $(document).on('click',".heart-btn",function(event){
    var heartIndex = $(this).attr("name"),
      op;
    if ( !$(this).hasClass('flagged') ){
      op = "+ 1";
      animateHeart(event.clientX,event.clientY);
      $(this).addClass('flagged')
    } else {
      op = "- 1";
      $(this).removeClass('flagged')
    }
    postData( "php/heart.php", {
      id: heartIndex,
      op: op
    });
  });


  $(document).on("hidden.bs.collapse", ".collapse", function () {resizeHandler()});
  $(window).resize(function(){resizeHandler()});
  $(window).ajaxStart(function() {
      ajaxrunning = true;
  });
  $(window).ajaxStop(function() {
      ajaxrunning = false;
  });
  $(window).load(go);
  