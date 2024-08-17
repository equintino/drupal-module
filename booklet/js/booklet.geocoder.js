(function($, Drupal, drupalSettings) {

  Drupal.Booklet.prototype.query_url_serialize = function(obj, prefix) {
    let str = [], p;
    for (p in obj) {
      if (obj.hasOwnProperty(p)) {
        let k = prefix ? prefix + "[" + p + "]" : p,
          v = obj[p];
        str.push((v !== null && typeof v === "object") ?
          Drupal.Booklet.prototype.query_url_serialize(v, k) :
          encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
  };

  Drupal.Booklet.prototype.geocode = function(address, providers, options) {
    let base_url = drupalSettings.path.baseUrl;
    let geocode_path = base_url + 'geocoder/api/geocode';
    options = Drupal.Booklet.prototype.query_url_serialize(options);
    return $.ajax({
      url: geocode_path + '?address=' +  encodeURIComponent(address) + '&geocoder=' + providers + '&' + options,
      type:"GET",
      contentType:"application/json; charset=utf-8",
      dataType: "json",
    });
  };

  Drupal.Booklet.prototype.map_geocoder_control = function(controlDiv, mapid) {
    let geocoder_settings = drupalSettings.booklet[mapid].map.settings.geocoder.settings;
    let control = new L.Control({position: geocoder_settings.position});
    control.onAdd = function() {
      let controlUI = L.DomUtil.create('div','geocoder booklet-control-geocoder-container');
      controlUI.id = mapid + '--booklet-control-geocoder-container';
      controlDiv.appendChild(controlUI);
      const autocomplete_placeholder = geocoder_settings['autocomplete'] ? geocoder_settings['autocomplete']['placeholder'] : 'Search Address';
      const autocomplete_title = geocoder_settings['autocomplete'] ? geocoder_settings['autocomplete']['title'] : 'Search an Address on the Map';

      // Set CSS for the control search interior.
      let controlSearch = document.createElement('input');
      controlSearch.placeholder = Drupal.t(autocomplete_placeholder);
      controlSearch.id = mapid + '--booklet--geocoder-control';
      controlSearch.title = Drupal.t(autocomplete_title);
      controlSearch.style.color = 'rgb(25,25,25)';
      controlSearch.style.padding = '0.2em 1em';
      controlSearch.style.borderRadius = '3px';
      controlSearch.size = geocoder_settings['input_size'] || 20;
      controlSearch.maxlength = 256;
      controlUI.appendChild(controlSearch);
      return controlUI;
    };
    return control;
  };

  Drupal.Booklet.prototype.map_geocoder_control.autocomplete = function(mapid, geocoder_settings) {
    const providers = geocoder_settings['providers'].toString();
    const options = geocoder_settings.options;
    const map = Drupal.Booklet[mapid].lMap;
    const zoom = geocoder_settings.zoom || 14;
    const selector = $('#' + mapid + '--booklet--geocoder-control');
    selector.autocomplete({
      autoFocus: true,
      minLength: geocoder_settings['min_terms'] || 4,
      delay: geocoder_settings.delay || 800,
      // This bit uses the geocoder to fetch address values.
      source: function (request, response) {
        let thisElement = this.element;
        thisElement.addClass('ui-autocomplete-loading');
        // Execute the geocoder.
        $.when(Drupal.Booklet.prototype.geocode(request.term, providers, options).then(
          // On Resolve/Success.
          function (results) {
            response($.map(results, function (item) {
              thisElement.removeClass('ui-autocomplete-loading');
              return {
                // the value property is needed to be passed to the select.
                value: item['formatted_address'],
                lat: item.geometry.location.lat,
                lng: item.geometry.location.lng
              };
            }));
          },
          // On Reject/Error.
          function() {
            response(function(){
              return false;
            });
          }));
      },
      // This bit is executed upon selection of an address.
      select: function (event, ui) {
        let position = L.latLng(ui.item.lat, ui.item.lng);
        map.setView(position, zoom);
        // If booklet-geoman functionalities and controls existing on the map,
        // then disableGlobalEditMode;
        // if(map.pm) {
        //   map.pm.disableGlobalEditMode();
        // }
        if (geocoder_settings.popup) {
          L.popup().setLatLng(position)
            .setContent('<div class="booklet-geocoder-popup">' + ui.item.value + '</div>')
            .openOn(map);
        }
      }
    });
  }

})(jQuery, Drupal, drupalSettings);
