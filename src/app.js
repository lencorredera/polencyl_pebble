/****************************************************************************
POLENCYL
  Developed by Luis Enrique Corredera (Twitter: @lencorredera)
  (c) 2015 FLAG Solutions S.L. (http://www.flagsolutions.net)
  All rights reserved.
  
  Version control:
  Current version: 0.1
  v0.1 - 20150221 - First version. Parses data from xml feed
****************************************************************************/

var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Settings = require('settings');


//var DATA_URL='http://www.datosabiertos.jcyl.es/web/jcyl/risp/es/mediciones/niveles_de_polen/1284208096554.xml';
var DATA_URL='http://pruebas2.flagsolutions.net/pebble/pollenproxy.php';


//Let's load settings
var MICIUDAD= Settings.option('ciudad');
console.log(MICIUDAD);


var parseFeed = function(polenData, quantity) {
 var items = [];
 var count;
 var i; 
  
  count = 0;
  i=0;

  for (i=0; i< polenData.list.element.estacion.length; i++){
//       console.log(polenData.document.list.element.estacion[i]["@attributes"].nombre);
      //For each city...
      var ciudad = polenData.list.element.estacion[i]["@attributes"].nombre;
      var niveles = '';
      var j; j=0;

      niveles += '----   ----   ----   ----\n';
      for (j=0; j< polenData.list.element.estacion[i].tipo_polinico.length; j++){
        niveles += polenData.list.element.estacion[i].tipo_polinico[j]["@attributes"].nombre;
        niveles +=':\n\t Real -> ' + polenData.list.element.estacion[i].tipo_polinico[j].valor_real.toLowerCase();
        niveles +='\n\t Prev -> ' + polenData.list.element.estacion[i].tipo_polinico[j].valor_previsto.toLowerCase();
        niveles += '\n----   ----   ----   ----\n';
      }


      items.push({
        title: ciudad,
        niveles: niveles,
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
          menuItems = parseFeed(data,10);
          
          resultsMenu = new UI.Menu({
              sections: [{
              title: 'Estaciones',
              items: menuItems
            }]
          });
          
          resultsMenu.on('select', function(e){
        
            var cardContent='';
            var cardTitle;
            Settings.option('Estacion',menuItems[e.itemIndex].title);      
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
          if (MICIUDAD != null){
            var cityIndex;
            for (cityIndex=0; cityIndex < menuItems.length; cityIndex++){
              if (MICIUDAD == menuItems[cityIndex].title){
                  defaultDetailCard= new UI. Card({
                    title:'Provincia',
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
        text:'Something went wrong. Please check your connection to DatosAbiertos and check for an app upgrade.',
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









