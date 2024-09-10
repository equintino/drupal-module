import Controller from "./Controller.js";
import GeojsonView from "../views/GeojsonView.js";
import GeojsonService from "../services/GeojsonService.js";

export default class GeojsonController extends Controller {
    path                  = '../modules/custom'
    distritoInConcelhos   = []
    concelhosInFreguesias = []

    static initializer() {
        const geojsonController = new GeojsonController({
                view: new GeojsonView(),
                service: new GeojsonService()
            }),
            page = geojsonController.view.page

        geojsonController.#layerGroup()
     }

    #layerGroup() {
        const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '©'
            }),
            osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '©'
            });

        const map = L.map('map', {
            center: [ 40.543577, -8.4532394 ],
            zoom: 7,
            layers: [osm],
            loadingControl: true
        })

        const baseMaps = {
                "OpenStreetMap": osm,
                "<span style='color: red'>OpenStreetMap.HOT</span>": osmHOT
            },
            layerControl = L.control.layers(baseMaps).addTo(map);

        const openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '©'
        });

        layerControl.addBaseLayer(openTopoMap, "OpenTopoMap");

        this.#graphicDensity({ map, layerControl })
            .then((density) => {
                layerControl.addOverlay(density, "Distritos")
            }
        )
    }

    getColorState(d) {
        if (d.distrito && !d.concelho)  return '#f3fd7e'
        if (d.concelho && !d.freguesia) return '#e18041'
        if (d.freguesia)                return '#d74222'
    }

    #graphicDensity({ map, layerControl }) {
        const style = (feature) => {
            return {
                fillColor: this.getColorState(feature.properties),
                weight: 2,
                opacity: 1,
                color: 'red',
                dashArray: '3',
                fillOpacity: 0.7
            }
        },
        regions = this.#getRegions({})

        return regions.then((_regions) => {
            const density = L.geoJSON(_regions, { style })
            return this.addInteration({ map, statesData: _regions, style, density, layerControl }).addTo(map)
        })
        .then((density) => density)
    }

    #getRegions({ distrito, concelho, freguesia }) {
        let file
        if (distrito == null && concelho == null) {
            file = `${this.path}/booklet/js/files/geojson/distritos.json`
            return this.service.getRegions({ file })
                .then((d) => {
                    d.unshift({ region: 'Distrito' })
                    return d
                }
            )
        }
        else if (distrito != null && concelho == null) {
            file = `${this.path}/booklet/js/files/geojson/concelhos.json`
            const filter = { properties: { dis_name: distrito }}
            return this.service.getRegions({ file, filter })
        }
        else if (freguesia == null && concelho != null) {
            file = `${this.path}/booklet/js/files/geojson/freguesias.json`
            const filter = { properties: { concelho: concelho } }
            return this.service.getRegions({ file, filter })
        }
    }

    addInteration({ map, statesData, style, density, layerControl }) {
        const highlightFeature = (e) => {
            const layer = e.target

            layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            })
        },
        resetHightlight = (e) => {
            density.resetStyle(e.target)
        },
        zoomToFeature = (e) => {
            map.fitBounds(e.target.getBounds())
        },
        info = this.#customControl({ map }),
        onEachFeature = (feature, layer) => {
            feature.properties = this.#customName(feature.properties)

            layer.on({
                mouseover: highlightFeature,
                mouseout : resetHightlight,
                click    : zoomToFeature
            })
            layer.on({
                mouseover: () => {
                    info.update(feature.properties)
                }
            })
            layer.on({
                click: () => {
                    let distrito  = feature.properties.distrito
                    let concelho  = feature.properties.concelho
                    let freguesia = feature.properties.freguesia

                    if (this.distritoInConcelhos.indexOf(distrito) !== -1 && !concelho) return

                    if (freguesia || this.concelhosInFreguesias.indexOf(concelho) !== -1) return

                    this.#getRegions({ distrito, concelho, freguesia })
                        .then((data) => {
                            let _d = L.geoJson(data, { onEachFeature }).addTo(map)
                            const hasLegend = layerControl._layers.filter((i) => {
                                return (i.name === distrito)
                            })
                            if (hasLegend.length === 0) layerControl.addOverlay(_d, `${distrito}`)
                            this.distritoInConcelhos.push(distrito)
                            if (concelho) {
                                layerControl.addOverlay(_d, `Freguesias de ${concelho}`)
                                this.concelhosInFreguesias.push(concelho)
                            }
                        }
                    )
                }
            })
        }
        this.#customLegendControl(map)
        return L.geoJson(statesData, {
            style,
            onEachFeature
        })
    }

    /** Customize names */
    #customName(properties) {
        const filter = {
            'dis_name'  : 'distrito',
            'distrito'  : 'distrito',
            'con_name'  : 'concelho',
            'brasao'    : 'brasao',
            'freguesia' : 'freguesia',
            'concelho'  : 'concelho'
        }
        const data = {}
        for (let i in properties) {
            if (filter.hasOwnProperty(i)) data[filter[i]] = properties[i]
        }
        return data
    }

    /** Custom Control */
    #customControl({ map }) {
        const info = L.control();

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        // method that we will use to update the control based on feature properties passed
        info.update = async function (props) {
            if (typeof(props) === 'object') {
                this._div.innerHTML = '<h4>DETAILS</h4>'
                this._div.innerHTML += (props.distrito ? `<p>DISTRITO: ${props.distrito}</p>`: '')
                this._div.innerHTML += (props.concelho ? `<p>CONCELHO: ${props.concelho}</p>` : '')
                this._div.innerHTML += (props.freguesia ? `<p>FREGUESIA: ${props.freguesia}</p>` : '')
                this._div.innerHTML += (props.brasao && props.brasao !== 'nan' ? `<p><img src=${props.brasao} alt="sem brasao" /></p>` : '')
            }
        };

        info.addTo(map);
        return info
    }

    #customLegendControl(map) {
        const legend = L.control({ position: 'bottomleft' })

        legend.onAdd = function (map) {
            const div = L.DomUtil.create('div', 'info legend'),
                getColor = {
                    Distrito : '#f3fd7e',
                    Concelho : '#e18041',
                    Freguesia: '#d74222'
                }
            // loop through our density intervals and generate a label with a colored square for each interval
            for (let d in getColor) {
                div.innerHTML +=
                    '<i style="background:' + getColor[d] + '"></i> ' + d + '<br>'
            }

            return div;
        };

        legend.addTo(map);
    }
}
