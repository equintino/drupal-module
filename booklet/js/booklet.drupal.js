(function($, Drupal, drupalSettings) {
  Drupal.behaviors.booklet = {
    attach: function(context, settings) {

      // For each booklet Map/id defined process with booklet Map and Features
      // generation.
      $.each(settings.booklet, function(m, data) {

        // Ensure the booklet Behavior is attached only once to each booklet map
        // id element.
        // @see https://www.drupal.org/project/leaflet/issues/3314762#comment-15044223
        const booklet_elements = $(once('behaviour-booklet', '#' + data['mapid']));
        booklet_elements.each(function () {
          let map_container = $(this);
          let mapid = data['mapid'];

          // Function to load the booklet Map, based on the provided mapid.
          function loadMap(mapid) {
            // Process a new booklet Map only if the map container is empty.
            // Avoid reprocessing a booklet Map already initialised.
            if (map_container.data('booklet') === undefined) {
              map_container.data('booklet', new Drupal.Booklet(L.DomUtil.get(mapid), mapid, data.map));
              if (data.features.length > 0) {
                // Add booklet Map Features.
                map_container.data('booklet').add_features(data.features, true);
              }

              // Add the booklet map to data settings object to make it accessible.
              // @NOTE: This is used by the booklet Widget module.
              data.lMap = map_container.data('booklet').lMap;

              // Add the booklet Map Markers to data settings object to make it accessible.
              data.markers = map_container.data('booklet').markers;

              // Set initial Map position to wrap its defined bounds.
              map_container.data('booklet').fitBounds();

              // Set the start center and the start zoom.
              if (!map_container.data('booklet').start_center && !map_container.data('booklet').start_zoom) {
                map_container.data('booklet').start_center = map_container.data('booklet').lMap.getCenter();
                map_container.data('booklet').start_zoom = map_container.data('booklet').lMap.getZoom();
              }

              // Define the global Drupal.booklet[mapid] object to be accessible
              // from outside - NOTE: This should always be created after setting
              // the (above) start center.
              Drupal.Booklet[mapid] = map_container.data('booklet');

              // Add the Map Geocoder Control if requested.
              if (!Drupal.Booklet[mapid].geocoder_control && Drupal.Booklet.prototype.map_geocoder_control) {
                let mapGeocoderControlDiv = document.createElement('div');
                Drupal.Booklet[mapid].geocoder_control = Drupal.Booklet.prototype.map_geocoder_control(mapGeocoderControlDiv, mapid);
                Drupal.Booklet[mapid].geocoder_control.addTo(Drupal.Booklet[mapid].lMap)
                let geocoder_settings = drupalSettings.Booklet[mapid].map.settings.geocoder.settings;
                Drupal.Booklet.prototype.map_geocoder_control.autocomplete(mapid, geocoder_settings);
              }

              // Add the Layers Control, if initialised/existing.
              if (Drupal.Booklet[mapid].layer_control) {
                Drupal.Booklet[mapid].lMap.addControl(Drupal.Booklet[mapid].layer_control);
              }

              // Add and Initialise the Map Reset View Control if requested.
              if (!Drupal.Booklet[mapid].reset_view_control && map_container.data('booklet').map_settings.reset_map && map_container.data('booklet').map_settings.reset_map.control) {
                let map_reset_view_options = map_container.data('booklet').map_settings.reset_map.options ? JSON.parse(map_container.data('booklet').map_settings.reset_map.options) : {};
                map_reset_view_options.latlng = map_container.data('booklet').start_center;
                map_reset_view_options.zoom = map_container.data('booklet').start_zoom;
                Drupal.Booklet[mapid].reset_view_control = L.control.resetView(map_reset_view_options).addTo(map_container.data('booklet').lMap);
              }

              // Add and Initialise the Map Scale Control if requested.
              if (!Drupal.Booklet[mapid].map_scale_control && map_container.data('booklet').map_settings.map_scale && map_container.data('booklet').map_settings.map_scale.control) {
                const map_scale_options = map_container.data('booklet').map_settings.map_scale.options ? JSON.parse(map_container.data('booklet').map_settings.map_scale.options) : {};
                Drupal.Booklet[mapid].map_scale_control = L.control.scale(map_scale_options).addTo(map_container.data('booklet').lMap);
              }

              // Add the Locate Control if requested.
              if (!Drupal.Booklet[mapid].locate_control && map_container.data('booklet').map_settings.locate && map_container.data('booklet').map_settings.locate.control) {
                let locate_options = map_container.data('booklet').map_settings.locate.options ? JSON.parse(map_container.data('booklet').map_settings.locate.options) : {};
                Drupal.Booklet[mapid].locate_control = L.control.locate(locate_options).addTo(map_container.data('booklet').lMap);

                // In case this booklet Map is not in a Widget Context, eventually perform the Automatic User Locate, if requested.
                if (!data.hasOwnProperty('booklet_widget') && map_container.data('booklet').map_settings.hasOwnProperty('locate') && map_container.data('booklet').map_settings.locate.automatic) {
                  Drupal.Booklet[mapid].locate_control.start();
                }
              }

              // Add Fullscreen Control, if requested.
              if (!Drupal.Booklet[mapid].fullscreen_control && map_container.data('booklet').map_settings.fullscreen && map_container.data('booklet').map_settings.fullscreen.control) {
                let map_fullscreen_options = map_container.data('booklet').map_settings.fullscreen.options ? JSON.parse(map_container.data('booklet').map_settings.fullscreen.options) : {};
                Drupal.Booklet[mapid].fullscreen_control = L.control.fullscreen(
                  map_fullscreen_options
                ).addTo(map_container.data('booklet').lMap);
              }

              // Attach booklet Map listeners On Popup Open.
              data.lMap.on('popupopen', function (e) {

                // On booklet-ajax-popup selector, fetch and set Ajax content.
                let element = e.popup._contentNode;
                let content = $('*[data-booklet-ajax-popup]', element);
                if (content.length) {
                  let url = content.data('booklet-ajax-popup');
                  Drupal.ajax({url: url}).execute().done(function (data) {

                    // Copy the html we received via AJAX to the popup, so we won't
                    // have to make another AJAX call (#see 3258780).
                    e.popup.setContent(data[0].data);

                    // Attach drupal behaviors on new content.
                    Drupal.attachBehaviors(element, drupalSettings);
                  }).
                    // In case of failing fetching data.
                    fail(function () {
                      e.popup.close();
                    });
                }

                // Make the (eventually present) Tooltip disappear on Popup Open
                // in case the Popup is generated from a _source.
                if (e.popup._source) {
                  let tooltip = e.popup._source.getTooltip();
                  // not all features will have tooltips!
                  if (tooltip) {
                    // use opacity to make the tooltip disappear.
                    e.popup._source.getTooltip().setOpacity(0);
                  }
                }
              });

              // Attach booklet Map listeners On Popup Close.
              data.lMap.on('popupclose', function (e) {
                // Make the (eventually present) Tooltip re-appear on Popup Close.
                // in case the Popup is generated from a _source.
                if (e.popup._source) {
                  let tooltip = e.popup._source.getTooltip();
                  if (tooltip) tooltip.setOpacity(0.9);
                }
              });

              // NOTE: don't change this trigger arguments print, for back porting
              // compatibility.
              $(document).trigger('bookletMapInit', [data.map, data.lMap, mapid, data.markers]);
              // (Keep also the pre-existing event for back port compatibility)
              $(document).trigger('booklet.map', [data.map, data.lMap, mapid, data.markers]);
            }
          }

          // If the IntersectionObserver API is available, create an observer to load the map when it enters the viewport
          // It will be used to handle map loading instead of displaying the map on page load.
          let mapObserver = null;
          if ('IntersectionObserver' in window){
            mapObserver = new IntersectionObserver(function (entries, observer) {
              for(var i = 0; i < entries.length; i++) {
                if(entries[i].isIntersecting){
                  const mapid = entries[i].target.id;
                  loadMap(mapid);
                }
              }
            });
          }

          // Load the booklet Map, lazy based on the mapObserver, or not.
          if (mapObserver && data.map.settings['map_lazy_load'] && data.map.settings['map_lazy_load']['lazy_load']) {
            mapObserver.observe(this)
          } else {
            loadMap(mapid);
          }

        });
      });
    }
  };

  /**
   * Define a main Drupal.booklet function being generated/triggered on each
   * booklet Map map_container element load.
   *
   * @param map_container
   *   The booklet Map map_container.
   * @param mapid
   *   The booklet Map id.
   * @param map_definition
   *   The booklet Map definition.
   * @constructor
   */
  Drupal.Booklet = function(map_container, mapid, map_definition) {
    this.mapid = mapid;
    this.map_container = map_container;
    this.map_definition = map_definition;
    this.map_settings = this.map_definition.settings;
    this.bounds = [];
    this.base_layers = {};
    this.overlays = {};
    this.lMap = null;
    this.start_center = null;
    this.start_zoom = null;
    this.layer_control = null;
    this.markers = {};
    this.features = {};
    this.initialise(mapid);
  };

  /**
   * Initialise the specific booklet Map
   *
   * @param mapid
   *   The dom element #id to inject the booklet Map into.
   */
  Drupal.Booklet.prototype.initialise = function(mapid) {
    // Instantiate a new booklet map.
    this.lMap = new L.Map(mapid, this.map_settings);

    // Add map layers (base and overlay layers).
    let i = 0;
    for (let key in this.map_definition.layers) {
      let layer = this.map_definition.layers[key];
      // Distinguish between "base" and "overlay" layers.
      // Default to "base" in case "layer_type" has not been defined in hook_booklet_map_info().
      layer.layer_type = (typeof layer.layer_type === 'undefined') ? 'base' : layer.layer_type;

      switch (layer.layer_type) {
        case 'overlay':
          const overlay_layer = this.create_layer(layer, key);
          const layer_hidden = (typeof layer.layer_hidden === "undefined") ? false : layer.layer_hidden;
          this.add_overlay(key, overlay_layer, layer_hidden);
          break;

        default:
          this.add_base_layer(key, layer, i);
          // Only the first base layer needs to be added to the map - all the
          // others are accessed via the layer switcher.
          if (i === 0) {
            i++;
          }
          break;
      }
      i++;
    }

    // Set initial view, fallback to displaying the whole world.
    if (this.map_settings.center && this.map_settings.zoom) {
      this.lMap.setView(new L.LatLng(this.map_settings.center.lat, this.map_settings.center.lon), this.map_settings.zoom);
    }
    else {
      this.lMap.fitWorld();
    }

    // Set the position of the Zoom Control.
    this.lMap.zoomControl.setPosition(this.map_settings.zoomControlPosition);

    // Set to refresh when first in viewport to avoid missing visibility.
    new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if(entry.intersectionRatio > 0) {
          this.lMap.invalidateSize();
          observer.disconnect();
        }
      });
    }).observe(this.lMap._container);

  };

  /**
   * Initialise the booklet Map Layers (Overlays) Control
   */
  Drupal.Booklet.prototype.initialise_layers_control = function() {
    let count_layers = function(obj) {
      // Browser compatibility: Chrome, IE 9+, FF 4+, or Safari 5+.
      // @see http://kangax.github.com/es5-compat-table/
      return Object.keys(obj).length;
    };

    // Only add a layer switcher if it is enabled in settings, and we have
    // at least two base layers or at least one overlay.
    if (this.layer_control == null && ((this.map_settings.layerControl && count_layers(this.base_layers) > 1 || count_layers(this.overlays) > 0))) {
      const base_layers = count_layers(this.base_layers) > 1 ? this.base_layers : [];
      // Instantiate layer control, using settings.layerControl as settings.
      this.layer_control = new L.Control.Layers(base_layers, [], this.map_settings.layerControlOptions);
    }
  };

  /**
   * Create & Add a Base Layer to the booklet Map and Layers Control.
   *
   * @param key
   *   The Layer index/label.
   * @param definition
   *   The Layer definition,
   * @param i
   *   The layers progressive counter.
   */
  Drupal.Booklet.prototype.add_base_layer = function(key, definition, i) {
    const base_layer = this.create_layer(definition, key);
    this.base_layers[key] = base_layer;

    // Only the first base layer needs to be added to the map - all the others are accessed via the layer switcher.
    if (i === 0) {
      this.lMap.addLayer(base_layer);
    }

    // Initialise the Layers Control, if not yet.
    if (this.layer_control == null) {
      this.initialise_layers_control();
    } else {
      // Add the new base layer to layer_control.
      this.layer_control.addBaseLayer(base_layer, key);
    }
  };

  /**
   * Adds a Specific Layer and related Overlay to the booklet Map.
   *
   * @param {string} label
   *   The Overlay Layer Label.
   * @param layer
   *   The booklet Overlay.
   * @param {bool} hidden_layer
   *   The flag to disable the Layer from the Over Layers Control.
   */
  Drupal.Booklet.prototype.add_overlay = function(label, layer, hidden_layer) {
    if (!hidden_layer) {
      this.lMap.addLayer(layer);
    }

    // Add the Overlay to the Drupal.booklet object.
    this.overlays[label] = layer;

    // Initialise the Layers Control, if it is not.
    if (label && this.layer_control == null) {
      this.initialise_layers_control();
    }

    // Add the Overlay to the Layer Control only if there is a Label.
    if (label && this.layer_control) {
      // If we already have a layer control, add the new overlay to it.
      this.layer_control.addOverlay(layer, label);
    }

  };

  /**
   *
   * Add booklet Features to the booklet Map.
   *
   * @param features
   *   Features List definition.
   *
   * @param initial
   *   Boolean to identify initial status.
   */
  Drupal.Booklet.prototype.add_features = function(features, initial) {
    // Define Map Layers holder.
    let layers = {};

    for (let i = 0; i < features.length; i++) {
      let feature = features[i];
      let lFeature;

      // In case of a Features Group.
      if (feature.group) {
        // Define a named Layer Group
        layers[feature['group_label']] = this.create_feature_group();
        for (let groupKey in feature.features) {
          let groupFeature = feature.features[groupKey];
          lFeature = this.create_feature(groupFeature);
          if (lFeature !== undefined) {
            // Add the lFeature to the lGroup.
            layers[feature['group_label']].addLayer(lFeature);

            // Allow others to do something with the feature that was just added to the map.
            $(document).trigger('booklet.feature', [lFeature, groupFeature, this, layers]);
          }
        }

        // Add the group to the layer switcher.
        this.add_overlay(feature.group_label, layers[feature['group_label']], feature['disabled']);
      }
      else {
        lFeature = this.create_feature(feature);
        if (lFeature !== undefined) {
          // Add the booklet Feature to the Map.
          this.lMap.addLayer(lFeature);

          // Allow others to do something with the feature that was just added to the map.
          $(document).trigger('booklet.feature', [lFeature, feature, this]);
        }
      }
    }

    // Allow plugins to do things after features have been added.
    $(document).trigger('booklet.features', [initial || false, this])
  };

  /**
   * Create a booklet Feature Group.
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_feature_group = function() {
    return new L.featureGroup();
  };

  /**
   * Add booklet Popup to the booklet Feature.
   *
   * @param lFeature
   * @param lFeature
   *   The booklet Feature
   * @param feature
   *   The Feature coming from Drupal settings.
   */
  Drupal.Booklet.prototype.feature_bind_popup = function(lFeature, feature) {
    if (feature.popup) {
      const popup_options = feature.popup.options ? JSON.parse(feature.popup.options) : {};
      lFeature.bindPopup(feature.popup.value, popup_options);
    }
  };

  /**
   * Add booklet Tooltip to the booklet Feature.
   * @param lFeature
   *   The booklet Feature
   * @param feature
   *   The Feature coming from Drupal settings.
   */
  Drupal.Booklet.prototype.feature_bind_tooltip = function(lFeature, feature) {
    // Set the booklet Tooltip, with its options (if the stripped value is not null).
    if (feature.tooltip && feature.tooltip.value.replace(/(<([^>]+)>)/gi, "").trim().length > 0) {
      const tooltip_options = feature.tooltip.options ? JSON.parse(feature.tooltip.options) : {};
      lFeature.bindTooltip(feature.tooltip.value, tooltip_options);
    }
  };

  /**
   * Set booklet Feature path style.
   *
   * @param lFeature
   *   The booklet Feature
   * @param feature
   *   The Feature coming from Drupal settings.
   */
  Drupal.Booklet.prototype.set_feature_path_style = function(lFeature, feature) {
    const lFeature_path_style = feature.path ? (feature.path instanceof Object ? feature.path : JSON.parse(feature.path)) : {};
    // Make sure that the weight property is cast into integer, for avoiding
    // polygons eventually disappearing with pan and zooming.
    // @see: https://stackoverflow.com/a/65892728/5451394
    if (lFeature_path_style.hasOwnProperty('weight')) {
      lFeature_path_style.weight = parseInt(lFeature_path_style.weight);
    }
    lFeature.setStyle(lFeature_path_style);
  };

  /**
   * Extend Map Bounds with new lFeature/feature.
   *
   * @param lFeature
   *   The booklet Feature
   * @param feature
   *   The Feature coming from Drupal settings.
   *   (this parameter should be kept to eventually extend this method with
   *   conditional logics on feature properties)
   */
  Drupal.Booklet.prototype.extend_map_bounds = function(lFeature, feature) {
    if (feature.type === 'point') {
      this.bounds.push([feature.lat, feature.lon]);
    } else if (lFeature.getBounds) {
      this.bounds.push(lFeature.getBounds().getSouthWest(), lFeature.getBounds().getNorthEast());
    }
  };

  /**
   * Add Marker and Feature to the Drupal.booklet object.
   *
   * @param lFeature
   *   The booklet Feature
   * @param feature
   *   The Feature coming from Drupal settings.
   */
  Drupal.Booklet.prototype.push_markers_features = function(lFeature, feature) {
    if (feature['entity_id']) {
      // Generate the markers object index based on entity id (and geofield
      // cardinality), and add the marker to the markers object.
      let entity_id = feature.entity_id;
      if (this.map_definition.geofield_cardinality && this.map_definition.geofield_cardinality !== 1) {
        let i = 0;
        while (this.markers[entity_id + '-' + i]) {
          i++;
        }
        this.markers[entity_id + '-' + i] = lFeature;
        this.features[entity_id + '-' + i] = feature;
      }
      else {
        this.markers[entity_id] = lFeature;
        this.features[entity_id] = feature;
      }
    }
  }

  /**
   * Generates a booklet Geometry (Point or Geometry)
   *
   * @param feature
   *   The feature definition coming from Drupal backend.
   * @param map_settings
   *   The map_settings if defined, false otherwise..
   *
   * @returns {*}
   *   The generated booklet Geometry.
   */
  Drupal.Booklet.prototype.create_geometry = function(feature, map_settings = false) {
    let lFeature;
    switch (feature.type) {
      case 'point':
        lFeature = this.create_point(feature);
        break;

      case 'linestring':
        lFeature = this.create_linestring(feature, map_settings ? map_settings['booklet_markercluster']['include_path'] : false);
        break;

      case 'polygon':
        lFeature = this.create_polygon(feature, map_settings ? map_settings['booklet_markercluster']['include_path'] : false);
        break;

      case 'multipolygon':
        lFeature = this.create_multipolygon(feature, map_settings ? map_settings['booklet_markercluster']['include_path'] : false);
        break;

      case 'multipolyline':
        lFeature = this.create_multipoly(feature, map_settings ? map_settings['booklet_markercluster']['include_path'] : false);
        break;

      // In case of singular cases where feature.type is json we use this.create_json method.
      // @see https://www.drupal.org/project/leaflet/issues/3377403
      // @see https://www.drupal.org/project/leaflet/issues/3186029
      case 'json':
        lFeature = this.create_json(feature.json, feature.events);
        break;

      case 'multipoint':
      case 'geometrycollection':
        lFeature = this.create_collection(feature);
        break;

      default:
        lFeature = {};
    }
    return lFeature;
  }

  /**
   * Generates a booklet Feature (Point or Geometry)
   * with booklet adds on (Tooltip, Popup, Path Styles, etc.)
   *
   * @param feature
   *   The feature definition coming from Drupal backend.
   * @returns {*}
   *   The generated booklet Feature.
   */
  Drupal.Booklet.prototype.create_feature = function(feature) {

    const map_settings = this.map_settings ?? NULL;
    let lFeature = this.create_geometry(feature, map_settings);

    // Eventually add Tooltip to the lFeature.
    this.feature_bind_tooltip(lFeature, feature);

    // Eventually add Popup to the lFeature.
    this.feature_bind_popup(lFeature, feature);

    // Eventually Set Style for Path/Geometry lFeature.
    if (lFeature.setStyle) {
      this.set_feature_path_style(lFeature, feature);
    }

    // Eventually extend Map Bounds with new lFeature.
    this.extend_map_bounds(lFeature, feature);

    // Add Marker and Feature to the Drupal.booklet object.
    this.push_markers_features(lFeature, feature);

    return lFeature;
  };

  /**
   * Generate a booklet Layer.
   *
   * @param layer
   *   The Layer definition.
   * @param key
   *   The Layer index/label.
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_layer = function(layer, key) {
    let self = this;
    let map_layer;
    const layer_type = layer.type ?? 'base';
    const urlTemplate = layer.urlTemplate ?? '';
    const layer_options =  layer.options ?? {};

    switch (layer_type) {
      case 'wms':
        map_layer = new L.tileLayer.wms(urlTemplate, layer_options);
        break;

      case 'vector':
        map_layer = new L.maplibreGL({
          'style': urlTemplate,
          'attribution': layer_options.attribution ?? ''
        });
        break;

      default:
        map_layer = new L.tileLayer(urlTemplate, layer_options);
    }

    map_layer._booklet_id = key;

    // Layers served from TileStream need this correction in the y coordinates.
    // TODO: Need to explore this more and find a more elegant solution.
    if (layer.type === 'tilestream') {
      map_layer.getTileUrl = function(tilePoint) {
        self._adjustTilePoint(tilePoint);
        let zoom = self._getZoomForUrl();
        return L.Util.template(self._url, L.Util.extend({
          s: self._getSubdomain(tilePoint),
          z: zoom,
          x: tilePoint.x,
          y: Math.pow(2, zoom) - tilePoint.y - 1
        }, self.options));
      }
    }
    return map_layer;
  };

  /**
   * booklet Icon creator.
   *
   * @param options
   *   The Icon options.
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_icon = function(options) {
    let icon_options = {
      iconUrl: options.iconUrl,
    };

    // Override applicable marker defaults.
    if (options.iconSize) {
      icon_options.iconSize = new L.Point(parseInt(options.iconSize.x), parseInt(options.iconSize.y));
    }
    if (options.iconAnchor && options.iconAnchor.x && options.iconAnchor.y) {
      icon_options.iconAnchor = new L.Point(parseInt(options.iconAnchor.x), parseInt(options.iconAnchor.y));
    }
    if (options.popupAnchor && options.popupAnchor.x && options.popupAnchor.y) {
      icon_options.popupAnchor = new L.Point(parseInt(options.popupAnchor.x), parseInt(options.popupAnchor.y));
    }
    if (options.shadowUrl) {
      icon_options.shadowUrl = options.shadowUrl;
    }
    if (options.iconRetinaUrl) {
      icon_options.iconRetinaUrl = options.iconRetinaUrl;
    }
    if (options.shadowSize && options.shadowSize.x && options.shadowSize.y) {
      icon_options.shadowSize = new L.Point(parseInt(options.shadowSize.x), parseInt(options.shadowSize.y));
    }
    if (options.shadowAnchor && options.shadowAnchor.x && options.shadowAnchor.y) {
      icon_options.shadowAnchor = new L.Point(parseInt(options.shadowAnchor.x), parseInt(options.shadowAnchor.y));
    }
    if (options.className) {
      icon_options.className = options.className;
    }

    return new L.Icon(icon_options);
  };

  /**
   * booklet DIV Icon creator.
   *
   * @param options
   *   The Icon options.
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_divicon = function (options) {
    let html_class = options['html_class'] || '';
    let icon = new L.DivIcon({html: options.html, className: html_class});

    // override applicable marker defaults
    if (options.iconSize) {
      icon.options.iconSize = new L.Point(parseInt(options.iconSize.x, 10), parseInt(options.iconSize.y, 10));
    }
    if (options.iconAnchor && options.iconAnchor.x && options.iconAnchor.y) {
      icon.options.iconAnchor = new L.Point(parseInt(options.iconAnchor.x), parseInt(options.iconAnchor.y));
    }
    if (options.popupAnchor && !isNaN(options.popupAnchor.x) && !isNaN(options.popupAnchor.y)) {
      icon.options.popupAnchor = new L.Point(parseInt(options.popupAnchor.x), parseInt(options.popupAnchor.y));
    }

    return icon;
  };

  /**
   * booklet Point creator.
   *
   * @param marker
   *   The Marker definition.
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_point = function(marker) {
    const latLng = new L.LatLng(marker.lat, marker.lon);
    let lMarker;
    // Assign the marker title value depending if a Marker simple title or a
    // booklet tooltip was set.
    let marker_title = '';
    if (marker.title) {
      marker_title = marker.title.replace(/<[^>]*>/g, '').trim()
    }
    else if (marker.tooltip && marker.tooltip.value) {
      marker_title = marker.tooltip.value.replace(/<[^>]*>/g, '').trim();
    }
    let options = {
      title: marker_title,
      className: marker.className || '',
      alt: marker_title,
      group_label: marker.group_label ?? '',
    };

    lMarker = new L.Marker(latLng, options);

    if (marker.icon) {
      if (marker.icon.iconType && marker.icon.iconType === 'html' && marker.icon.html) {
        let icon = this.create_divicon(marker.icon);
        lMarker.setIcon(icon);
      }
      else if (marker.icon.iconType && marker.icon.iconType === 'circle_marker') {
        try {
          options = marker.icon.circle_marker_options ? JSON.parse(marker.icon.circle_marker_options) : {};
          options.radius = options.radius ? parseInt(options['radius']) : 10;
        }
        catch (e) {
          options = {};
        }
        lMarker = new L.CircleMarker(latLng, options);
      }
      else if (marker.icon.iconUrl) {
        marker.icon.iconSize = marker.icon.iconSize || {};
        marker.icon.iconSize.x = marker.icon.iconSize.x || this.naturalWidth;
        marker.icon.iconSize.y = marker.icon.iconSize.y || this.naturalHeight;
        if (marker.icon.shadowUrl) {
          marker.icon.shadowSize = marker.icon.shadowSize || {};
          marker.icon.shadowSize.x = marker.icon.shadowSize.x || this.naturalWidth;
          marker.icon.shadowSize.y = marker.icon.shadowSize.y || this.naturalHeight;
        }
        let icon = this.create_icon(marker.icon);
        lMarker.setIcon(icon);
      }
    }

    return lMarker;
  };

  /**
   * booklet Linestring creator.
   *
   * @param polyline
   *   The Polyline definition.
   * @param clusterable
   *   Clusterable bool option.
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_linestring = function(polyline, clusterable = false) {
    let latlngs = [];
    for (let i = 0; i < polyline.points.length; i++) {
      let latlng = new L.LatLng(polyline.points[i].lat, polyline.points[i].lon);
      latlngs.push(latlng);
    }
    return clusterable ? new L.PolylineClusterable(latlngs) : new L.Polyline(latlngs);
  };

  /**
   *  booklet Collection creator.
   *
   * @param collection
   *   The collection definition.
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_collection = function(collection) {
    let layers = new L.featureGroup();
    for (let x = 0; x < collection.component.length; x++) {
      layers.addLayer(this.create_feature(collection.component[x]));
    }
    return layers;
  };

  /**
   * booklet Polygon creator.
   *
   * @param polygon
   *   The polygon definition,
   * @param clusterable
   *   Clusterable bool option.
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_polygon = function(polygon, clusterable = false) {
    let latlngs = [];
    for (let i = 0; i < polygon.points.length; i++) {
      let latlng = new L.LatLng(polygon.points[i].lat, polygon.points[i].lon);
      latlngs.push(latlng);
    }
    return clusterable ? new L.PolygonClusterable(latlngs) : new L.Polygon(latlngs);
  };

  /**
   * booklet Multi-Polygon creator.
   *
   * @param multipolygon
   *   The polygon definition,
   * @param clusterable
   *   Clusterable bool option.
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_multipolygon = function(multipolygon, clusterable = false) {
    let polygons = [];
    for (let x = 0; x < multipolygon.component.length; x++) {
      let latlngs = [];
      let polygon = multipolygon.component[x];
      for (let i = 0; i < polygon.points.length; i++) {
        let latlng = new L.LatLng(polygon.points[i].lat, polygon.points[i].lon);
        latlngs.push(latlng);
      }
      polygons.push(latlngs);
    }
    return clusterable ? new L.PolygonClusterable(polygons) : new L.Polygon(polygons);
  };

  /**
   * booklet Multi-Poly creator (both Polygons & Poly-lines)
   *
   * @param multipoly
   *   The multipoly definition,
   * @param clusterable
   *   Clusterable bool option.
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_multipoly = function(multipoly, clusterable = false) {
    let polygons = [];
    for (let x = 0; x < multipoly.component.length; x++) {
      let latlngs = [];
      let polygon = multipoly.component[x];
      for (let i = 0; i < polygon.points.length; i++) {
        let latlng = new L.LatLng(polygon.points[i].lat, polygon.points[i].lon);
        latlngs.push(latlng);
      }
      polygons.push(latlngs);
    }
    if (multipoly.multipolyline) {
      return clusterable ? new L.PolylineClusterable(polygons) : new L.Polyline(polygons);
    }
    else {
      return clusterable ? new L.PolygonClusterable(polygons) : new L.Polygon(polygons);
    }
  };

  /**
   * booklet Geo JSON Creator.
   *
   * In case of singular cases where feature.type is json we use this.create_json method.
   * @see https://www.drupal.org/project/leaflet/issues/3377403
   * @see https://www.drupal.org/project/leaflet/issues/3186029
   *
   * @param json
   *   The json input.
   * @param events
   *
   * @returns {*}
   */
  Drupal.Booklet.prototype.create_json = function(json, events) {
    let lJSON = new L.GeoJSON();
    const self = this;

    lJSON.options.onEachFeature = function(feature, layer) {
      for (let layer_id in layer._layers) {
        for (let i in layer._layers[layer_id]._latlngs) {
        }
      }
      if (feature.properties.style) {
        layer.setStyle(feature.properties.style);
      }
      if (feature.properties.booklet_id) {
        layer._booklet_id = feature.properties.booklet_id;
      }

      // Eventually add Tooltip to the lFeature.
      self.feature_bind_tooltip(layer, feature.properties);

      // Eventually add Popup to the Layer.
      self.feature_bind_popup(layer, feature.properties);

      for (e in events) {
        let layerParam = {};
        layerParam[e] = eval(events[e]);
        layer.on(layerParam);
      }
    };

    lJSON.addData(json);
    return lJSON;
  };


  // Set Map initial map position and Zoom. Different scenarios:
  //  1)  Force the initial map center and zoom to values provided by input settings
  //  2)  Fit multiple features onto map using booklet's fitBounds method
  //  3)  Fit a single polygon onto map using booklet's fitBounds method
  //  4)  Display a single marker using the specified zoom
  //  5)  Adjust the initial zoom using zoomFiner, if specified
  //  6)  Cater for a map with no features (use input settings for Zoom and Center, if supplied)
  //
  // @NOTE: This method used by booklet Markecluster module (don't remove/rename)
  Drupal.Booklet.prototype.fitBounds = function() {
    let start_zoom = this.map_settings.zoom ? this.map_settings.zoom : 12;
    // Note: this.map_settings.center might not be defined in case of booklet widget and Automatically locate user current position.
    let start_center = this.map_settings.center ? new L.LatLng(this.map_settings.center.lat, this.map_settings.center.lon) : new L.LatLng(0,0);

    //  Check whether the Zoom and Center are to be forced to use the input settings
    if (this.map_settings.map_position_force) {
      //  Set the Zoom and Center to values provided by the input settings
      this.lMap.setView(start_center, start_zoom);
    } else {
      if (this.bounds.length === 0) {
        //  No features - set the Zoom and Center to values provided by the input settings, if specified
        this.lMap.setView(start_center, start_zoom);
      } else {
        //  Set the Zoom and Center by using the booklet fitBounds function
        const bounds = new L.LatLngBounds(this.bounds);
        const fitbounds_options = this.map_settings.fitbounds_options ? JSON.parse(this.map_settings.fitbounds_options) : {};
        this.lMap.fitBounds(bounds, fitbounds_options);
        start_center = bounds.getCenter();
        start_zoom = this.lMap.getBoundsZoom(bounds);

        if (this.bounds.length === 1) {
          //  Single marker - set zoom to input settings
          this.lMap.setZoom(this.map_settings.zoom);
          start_zoom = this.map_settings.zoom;
        }
      }

      // In case of map initial position not forced, and zooFiner not null/neutral,
      // adapt the Map Zoom and the Start Zoom accordingly.
      if (this.map_settings.hasOwnProperty('zoomFiner') && parseInt(this.map_settings.zoomFiner)) {
        start_zoom += parseFloat(this.map_settings.zoomFiner);
        this.lMap.setView(start_center, start_zoom);
      }

      // Set the map start zoom and center.
      this.start_zoom = start_zoom;
      this.start_center = start_center;
    }

  };

  /**
   * Triggers a booklet Map Reset View action.
   *
   * @param mapid
   *   The Map identifier, to apply the rest to.
   */
  Drupal.Booklet.prototype.map_reset = function(mapid) {
    Drupal.Booklet[mapid].reset_view_control._resetView();
  };

  // Extend the L.Polyline to make it clustarable.
  // @see https://gis.stackexchange.com/questions/197882/is-it-possible-to-cluster-polygons-in-booklet
  L.PolylineClusterable = L.Polyline.extend({
    _originalInitialize: L.Polyline.prototype.initialize,

    initialize: function (bounds, options) {
      this._originalInitialize(bounds, options);
      this._latlng = this.getBounds().getCenter();
    },

    getLatLng: function () {
      return this._latlng;
    },

    setLatLng: function () {}
  });

  // Extend the L.Polygon to make it clustarable.
  // @see https://gis.stackexchange.com/questions/197882/is-it-possible-to-cluster-polygons-in-booklet
  L.PolygonClusterable = L.Polygon.extend({
    _originalInitialize: L.Polygon.prototype.initialize,

    initialize: function (bounds, options) {
      this._originalInitialize(bounds, options);
      this._latlng = this.getBounds().getCenter();
    },

    getLatLng: function () {
      return this._latlng;
    },

    setLatLng: function () {}
  });

})(jQuery, Drupal, drupalSettings);
