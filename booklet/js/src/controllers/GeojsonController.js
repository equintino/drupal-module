import Controller from "./Controller.js";
import GeojsonView from "../views/GeojsonView.js";
import GeojsonService from "../services/GeojsonService.js";
import { removeAccent, removeWhiteSpace } from "../lib/utils.js";

export default class GeojsonController extends Controller {
    #map
    div
    path                  = 'modules/custom'
    distritoInConcelhos   = []
    concelhosInFreguesias = []

    static async initializer() {
        const geojsonController = new GeojsonController({
            view: new GeojsonView(),
            service: new GeojsonService()
        })
        const page = geojsonController.view.page
        geojsonController.#layerGroup({
            // center: [ 38.6650095, -9.1784469 ],
            center: [ 38.66642, -9.17650 ],
            zoom: 17
        })
    }

    async #addImages(layerControl) {
        /** Piaget Almada building */
        // const pgt_alm_3d = await this.#imageOverlay({
        //     layerControl,
        //     imageUrl: `${this.path}/booklet/js/files/imagens/Piaget.png`,
        //     coodFile: `${this.path}/booklet/js/files/geojson/piaget/almada/pgt-alm.json`
        // })
        const pgt_alm = await this.#imageOverlay({
            layerControl,
            imageUrl: `${this.path}/booklet/js/files/imagens/Piaget_white_background.png`,
            coodFile: `${this.path}/booklet/js/files/geojson/piaget/almada/pgt-alm.json`
        })
        const pgt_alm_a0 = await this.#imageOverlay({
            layerControl, nameControl: "Edifícil A Piso 0",
            imageUrl: `${this.path}/booklet/js/files/imagens/Pgt-alm-a0.png`,
            coodFile: `${this.path}/booklet/js/files/geojson/piaget/almada/pgt-alm-a0.json`
        })
        const pgt_alm_a1 = await this.#imageOverlay({
            layerControl, nameControl: "Edifícil A Piso 1",
            imageUrl: `${this.path}/booklet/js/files/imagens/Pgt-alm-a1.png`,
            coodFile: `${this.path}/booklet/js/files/geojson/piaget/almada/pgt-alm-a0.json`
        })
        const pgt_alm_a2 = await this.#imageOverlay({
            layerControl, nameControl: "Edifícil A Piso 2",
            imageUrl: `${this.path}/booklet/js/files/imagens/Pgt-alm-a2.png`,
            coodFile: `${this.path}/booklet/js/files/geojson/piaget/almada/pgt-alm-a0.json`
        })

        /** PanelControl */
        const density = await L.geoJSON(pgt_alm.geojson, { style: pgt_alm.style })
        layerControl.addOverlay(pgt_alm.image, 'Piaget Almada' )
        // layerControl.addOverlay(pgt_alm_3d.image, 'Piaget Almada 3D' )

        this.addInteration({
            geojson: pgt_alm.geojson, style: pgt_alm.style,  density, layerControl
        }).addTo(this.#map)

        return [ pgt_alm, pgt_alm_a0, pgt_alm_a1, pgt_alm_a2 ]
    }

    async #layerGroup({ center, zoom }) {
        const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 21,
            attribution: '© OpenStreetMap'
        })
        const osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            maxZoom: 21,
            attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
        });
        const Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 21,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        })
        const baseMaps = {
            "OpenStreetMap": osm,
            "<span style='color: red'>OpenStreetMap.HOT</span>": osmHOT
        }
        const layerControl = L.control.layers(baseMaps)
        layerControl.addBaseLayer(Esri_WorldImagery, "Satélite")

        this.#map = L.map('map', {
            // center: [ 40.543577, -8.4532394 ],
            // zoom: 7,
            center, zoom,
            layers: [osm],
            loadingControl: true
        })

        /** Piaget Almada building */
        // const [ images, namesControl ] = await
        this.#addImages(layerControl)
        // for (let i in images) {
        //     console.log(
        //         images[i],
        //         namesControl[i]
        //     )
        //     layerControl.addOverLay(images[i], namesControl[i])
        // }
        // console.log(
        //     images,namesControl,
        //     layerControl
        // )
        // layerControl.addOverLay(images, namesControl)
        layerControl.addTo(this.#map)


    //////////////////////////////////////////////////
        /** Enable district */
        /** Districts */
        /**
        let file = `${this.path}/booklet/js/files/geojson/district.json`
        const district = await this.#getRegions({})
        this.#graphicDensity({ style, map, layerControl, file })
            .then((density) => {
                layerControl.addOverlay(density, "Distritos")
            }
        )
        density = L.geoJSON(district, { style })
        this.addInteration({
            map, style, density, layerControl,
            geojson: district
        }).addTo(map)
        */
     ///////////////////////////////////////////////
    }

    #getColorState(d) {
        if ((d.dis_name || d.distrito) && (!d.con_name && !d.concelho))  return '#f3fd7e'
        if ((d.con_name || d.concelho) && (!d.freguesia && !d.fre_name)) return '#e18041'
        if (d.fre_name || d.freguesia) return '#d74222'
    }

    /**
     * ImageOverlay (show buildings)
    */
    async #imageOverlay({ imageUrl, coodFile }) {
        const geojson = await this.service.getGeojson({
            file: coodFile,
            reverse: false
        })
        const style = (feature) => {
            return {
                fillColor: this.#getColorState(feature.properties),
                weight: 2,
                opacity: 0.01,
                // color: 'red',
                dashArray: '3',
                fillOpacity: 0.01
            }
        }

        const coordinates = geojson.features[0].geometry.coordinates[0]
        const imageBounds = this.service.coordReverse(coordinates)
        const image = L.imageOverlay(imageUrl, imageBounds, { opacity: 1 })

        /** PanelControl */
        // const density = await L.geoJSON(geojson, { style })
        // layerControl.addOverlay(image, nameControl)

        // this.addInteration({
        //     geojson, style,  density, layerControl
        // }).addTo(map)

        return { geojson, image, style }
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

    addInteration({ geojson, style, density, layerControl }) {
        const map = this.#map
        const info = this.#customControl()
        const highlightFeature = (e) => {
            const layer = e.target
            layer.setStyle({
                weight: 2,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.01
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
        // this.#customLegendControl(map)
        return L.geoJson(geojson, {
            style,
            onEachFeature
        })
    }

    /** Customize names */
    #customName(properties) {
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
    #customControl() {
        const map = this.#map
        const info = L.control();

        info.onAdd = function (map) {
            let div = document.querySelector('.info')
            this._div = div ?? L.DomUtil.create('div', 'info'); // create a div with a class "info"
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
            const div = L.DomUtil.create('div', 'info legend')
            let getColor = {
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
