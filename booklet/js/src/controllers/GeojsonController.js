import Controller from "./Controller.js";
import GeojsonView from "../views/GeojsonView.js";
import GeojsonService from "../services/GeojsonService.js";
import { removeAccent, removeWhiteSpace } from "../lib/utils.js";

export default class GeojsonController extends Controller {
    path                  = 'modules/custom'
    distritoInConcelhos   = []
    concelhosInFreguesias = []

    static initializer() {
        const geojsonController = new GeojsonController({
                view: new GeojsonView(),
                service: new GeojsonService()
            }),
            page = geojsonController.view.page

        geojsonController.#layerGroup({
            // center: [ 38.6650095, -9.1784469 ],
            // center: [ 38.6672692, -9.1740225 ],
            center: [ 38.66642, -9.17650 ],
            // center: [40.712216, -74.22655], //imageOverlay
            // center: [ 38666145, -9176470 ],
            zoom: 17
        })
     }

    #layerGroup({ center, zoom }) {
        const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '©'
            }),
            osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '©'
            });

        const map = L.map('map', {
            // center: [ 40.543577, -8.4532394 ],
            // zoom: 7,
            center, zoom,
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

        layerControl.addBaseLayer(openTopoMap, "OpenTopoMap")

        this.#imageOverlay({ map, layerControl })

    //////////////////////////////////////////////////
        /** Enable district */
        /** Districts */
        /**
        let file = `${this.path}/booklet/js/files/geojson/district.json`
        this.#graphicDensity({ map, layerControl, file })
            .then((density) => {
                layerControl.addOverlay(density, "Distritos")
            }
        )
        */
     ///////////////////////////////////////////////
    }

    getColorState(d) {
        if ((d.dis_name || d.distrito) && (!d.con_name && !d.concelho))  return '#f3fd7e'
        if ((d.con_name || d.concelho) && (!d.freguesia && !d.fre_name)) return '#e18041'
        if (d.fre_name || d.freguesia) return '#d74222'
    }

    async #imageOverlay({ map, layerControl }) {
        /**
         * ImageOverlay (show buildings)
        */
        const style = (feature) => {
            return {
                fillColor: this.getColorState(feature.properties),
                weight: 2,
                opacity: 1,
                // color: 'red',
                dashArray: '3',
                fillOpacity: 0.1
            }
        }
        const imageUrl = `${this.path}/booklet/js/files/imagens/Pgt-alm.png`
        const geojson = await this.service.getGeojson({
                file: `${this.path}/booklet/js/files/geojson/piaget/almada/pgt-alm.json`,
                reverse: true
            })
        const imageBounds = geojson.features[0].geometry.coordinates[0]
        L.imageOverlay(imageUrl, imageBounds, { opacity: 0.8 }).addTo(map)

        const coordReverse = await this.service.coordReverse(geojson)

        const density = await L.geoJSON(coordReverse, { style })
        this.addInteration({
            map, geojson, style, density, layerControl
        }).addTo(map)
    }

    async #graphicDensity({ map, layerControl, file }) {
        let geojson
        let density
        const style = (feature) => {
            return {
                fillColor: this.getColorState(feature.properties),
                weight: 2,
                opacity: 1,
                // color: 'red',
                dashArray: '3',
                fillOpacity: 0.7
            }
        }

        const district = await this.#getRegions({}) // Districts
        density = L.geoJSON(district, { style })
        this.addInteration({ map, geojson: district, style, density, layerControl }).addTo(map)
    }

    #getRegions({ distrito, concelho, freguesia, file }) {
        file = file ?? `${this.path}/booklet/js/files/geojson/district.json`
        if (distrito == null && concelho == null) {
            return this.service.getGeojson({ file, reverse: false })
                .then((d) => {
                    (
                        d.type === 'FeatureCollection' ? d.features.unshift({ region: 'Distrito'}) : d.unshift({ region: 'Distrito' })
                    )
                    return d
                }
            )
        }
        else if (distrito != null && concelho == null) {
            let _distrito = removeWhiteSpace(removeAccent(distrito)).toLowerCase()
            file = `${this.path}/booklet/js/files/geojson/concelhos/${_distrito}.json`
            const filter = { properties: { dis_name: distrito }}
            return this.service.getRegions({ file, filter })
        }
        else if (freguesia == null && concelho != null) {
            let _distrito = removeWhiteSpace(removeAccent(distrito)).toLowerCase()
            file = `${this.path}/booklet/js/files/geojson/freguesias/${_distrito}.json`
            const filter = { properties: { con_name: concelho } }
            return this.service.getRegions({ file, filter, type: 'freguesia' })
        }
    }

    addInteration({ map, geojson, style, density, layerControl }) {
        const info = this.#customControl({ map })
        const highlightFeature = (e) => {
            const layer = e.target
            layer.setStyle({
                weight: 2,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.2
            })
        }
        const resetHightlight = (e) => {
            density.resetStyle(e.target)
        }
        const zoomToFeature = (e) => {
            map.fitBounds(e.target.getBounds())
        }
        const onEachFeature = (feature, layer) => {
            feature.properties = this.#customName(feature.properties)

            layer.on({
                mouseover: highlightFeature,
                mouseout : resetHightlight,
                click    : zoomToFeature
            })
            layer.on({
                mouseover: () => info.update(feature.properties),
                mouseout: () => info.clear()
            })
            layer.on({
                click: () => {


                    /////////////////////////////////////////////////
                    /** Enable District */
                    /**
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
                    */
                    /////////////////////////////////////////////////


                }
            })
        }
        this.#customLegendControl(map)
        return L.geoJson(geojson, {
            style,
            onEachFeature
        })
    }

    /** Customize names */
    #customName(properties) {
        console.log(
            properties
        )
        const filter = {
            'name'        : 'name',
            'dis_name'    : 'distrito',
            'distrito'    : 'distrito',
            'Distrito'    : 'distrito',
            'con_name'    : 'concelho',
            'concelho'    : 'concelho',
            'Concelho'    : 'concelho',
            'fre_name'    : 'freguesia',
            'freguesia'   : 'freguesia',
            'Freguesia'   : 'freguesia',
            'brasao'      : 'brasao'
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
                // this._div.innerHTML = '<h4>DETAILS</h4>'
                this._div.innerHTML += (`<p>${props.name}<\p>` ?? '')
                this._div.innerHTML += (props.distrito ? `<p>DISTRITO: ${props.distrito}</p>`: '')
                this._div.innerHTML += (props.concelho ? `<p>CONCELHO: ${props.concelho}</p>` : '')
                this._div.innerHTML += (props.freguesia ? `<p>FREGUESIA: ${props.freguesia}</p>` : '')
                this._div.innerHTML += (props.brasao && props.brasao !== 'nan' ? `<p><img src=${props.brasao} alt="sem brasao" /></p>` : '')
            }
        };

        info.clear = () => document.querySelector('.info').innerHTML = ''

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
