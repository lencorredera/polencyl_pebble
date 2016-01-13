/****************************************************************************
POLENCYL
  Developed by Luis Enrique Corredera (Twitter: @lencorredera)
  (c) 2015 FLAG Solutions S.L. (http://www.flagsolutions.net)
  All rights reserved.
  
  Version control:
  Current version: 0.3
  v0.3 - 20150513 - Adapted to new levels from JCYL Open Data. 
                    PebbleJS crash fixed (limit number of levels per station)
                    Higher pollen levels appears first in the station card
                    
  v0.2 - 20150322 - Last station viewed used as "favorite" and shows 
                    on app startup
  v0.1 - 20150311 - First version. Parses data from xml feed
  
  Please note that although English words were used to name variables,
      there are also Spanish in some cases just be aligned with names
      available in data source (JCYL Open Data)
      
****************************************************************************/

var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Settings = require('settings');
var MAX_LEVELS_PER_STATION = 40; // To avoid a very large string in station cards that may crash the app

//var DATA_URL='http://www.datosabiertos.jcyl.es/web/jcyl/risp/es/mediciones/niveles_de_polen/1284208096554.xml';
//var DATA_URL='http://pruebas2.flagsolutions.net/pebble/pollenproxy.php';
var DATA_URL = 'http://www.flagsolutions.net/apis/pebble/pollenproxy.php';


//Let's load settings
var STATION= Settings.option('STATION');
console.log(STATION);


var parseFeed = function(polenData, quantity) {
 var items = [];
 var count=0;
 var i=0;


  for (i=0; i< polenData.list.element.estacion.length; i++){
//       console.log(polenData.document.list.element.estacion[i]["@attributes"].nombre);
//    console.log(i + "--" + JSON.stringify(polenData.list.element.estacion[i]["@attributes"].nombre));
      //For each city...
      var ciudad = polenData.list.element.estacion[i]["@attributes"].nombre;
      var niveles = [];
      var j; j=0;
      var nivelesText = '----   ----   ----   ----\n';
      var pollinic_limit; //max number of pollen levels to allow in a card

      pollinic_limit = (polenData.list.element.estacion[i].tipo_polinico.length < MAX_LEVELS_PER_STATION ? 
                   polenData.list.element.estacion[i].tipo_polinico.length: MAX_LEVELS_PER_STATION);
    
    
      for (j=0; j< pollinic_limit; j++){
        var order =30, order_real = 30, order_previsto =30; // 30 -> "bajo", 20-> "moderado", 10->"alto"
        var nivel =''; // Temp string to concat levels for current station and allow ordering
                       // Nivel value will be pushed into niveles array. 
        if (typeof(polenData.list.element.estacion[i].tipo_polinico[j]) != "undefined"){
          nivel += polenData.list.element.estacion[i].tipo_polinico[j]["@attributes"].nombre;
        } else {
          continue;
        }
        
        if (typeof(polenData.list.element.estacion[i].tipo_polinico[j].valor_real) != "undefined"){
          nivel +=':\n\t Real -> ' + polenData.list.element.estacion[i].tipo_polinico[j].valor_real.toLowerCase();
          // We'll sort values "alto" first, "moderado" second, and "bajo" third
          switch(polenData.list.element.estacion[i].tipo_polinico[j].valor_real.toLowerCase()){
            case "moderado":
              order_real =20;
              break;
            case "alto":
              order_previsto = 10;
          }
        }
        if (typeof(polenData.list.element.estacion[i].tipo_polinico[j].valor_previsto) != "undefined"){
          nivel +='\n\t Prev -> ' + polenData.list.element.estacion[i].tipo_polinico[j].valor_previsto.toLowerCase();
          switch(polenData.list.element.estacion[i].tipo_polinico[j].valor_previsto.toLowerCase()){
            case "moderado":
              order_real =20;
              break;
            case "alto":
              order_previsto = 10;
          }
        }
        nivel += '\n----   ----   ----   ----\n';


        order = (order_real < order_previsto? order_real : order_previsto); //I get the minimum (asc ordering)
          
        niveles.push({
          order:order,
          nivel:nivel
        });

      }

        niveles.sort(function(a,b) { return a.order - b.order } );
        for (var k=0; k< niveles.length; k++){
            nivelesText += niveles[k].nivel; 
        }    
      
      items.push({
        title: ciudad,
        niveles: nivelesText,
        id: i,
      });
}

  
  // Finally return whole array
  return items;
};



// Show splash screen while waiting for data
var splashWindow = new UI.Window();

// Text element to inform user
var text = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  text:'Respirando los niveles de polen...',
  font:'GOTHIC_28_BOLD',
  color:'black',
  textOverflow:'wrap',
  textAlign:'center',
	backgroundColor:'white'
});


splashWindow.add(text);

splashWindow.show();

setTimeout(function(){
/* // This callback is not triggering in current version due to platform problems
splashWindow.on('show',function (){
  console.log('splash window shown');
});
//*/

  ajax( //Get Pollen data from datosabiertos.jcyl.es
    {
      url: DATA_URL,
      type:'json' //Undefined to allow send form content
  
    },
    function(data) {
          var menuItems = [];
          var resultsMenu;
          menuItems = parseFeed(data,15);
          
          resultsMenu = new UI.Menu({
              sections: [{
              title: 'Estaciones',
              items: menuItems
            }]
          });
          
          resultsMenu.on('select', function(e){
        
            var cardContent='';
            var cardTitle;
            Settings.option('STATION',menuItems[e.itemIndex].title);      
//            console.log('ciudad setted');
            cardTitle = menuItems[e.itemIndex].title; // Pollen city name
            cardContent += menuItems[e.itemIndex].niveles; //Pollen level
            var detailCard;
            detailCard= new UI. Card({
              title:'Estación',
              subtitle:cardTitle,
              body:cardContent,
              scrollable:true,
              
            });
            detailCard.show();
          });
          
          //Let's add a detail for task
          
          resultsMenu.show();
          splashWindow.hide();
      
          // If a city was previously selected let's show it
          if (STATION != null){
            var cityIndex;
            for (cityIndex=0; cityIndex < menuItems.length; cityIndex++){
              if (STATION == menuItems[cityIndex].title){
                  var defaultDetailCard= new UI. Card({
                    title:'Estación',
                    subtitle:menuItems[cityIndex].title,
                    body:menuItems[cityIndex].niveles,
                    scrollable:true,   
                  });
                  defaultDetailCard.show();      
                break; // stop iterating
              }
            }
          }
        },
    function(error) {

      var errorWindow = new UI.Window();
      var errorText; 
      errorText = new UI.Text({
        position: new Vector2(0, 0),
        size: new Vector2(144, 168),
        text:'Error al conectar con DatosAbiertos. Comprueba tu conexion o actualiza PolenCyl.',
        font:'GOTHIC_28_BOLD',
        color:'black',
        textOverflow:'wrap',
        textAlign:'center',
      	backgroundColor:'white'
      });
      
      // Add to splashWindow and show
      errorWindow.add(errorText);
      errorWindow.show();
    }
  );// End Ajax
//}); // End splash.onShow() if it's active
},2000); // EndTimeout 2 seconds
// Add to splashWindow and show









