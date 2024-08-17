import Controller from "./Controller.js";
import GeojsonView from "../views/GeojsonView.js";
import GeojsonService from "../services/GeojsonService.js";

export default class GeojsonController extends Controller {
    path        = '../modules/custom'
    frePerCon   = {}
    distritos   = []
    concelhos   = []
    freguesias  = []
    missing     = {}

    static initializer() {
        const geojsonController = new GeojsonController({
                view: new GeojsonView(),
                service: new GeojsonService()
            }),
            page = geojsonController.view.page

        geojsonController.layerGroup()
     }

    ibad() {
        const map = this.service.initMap({
                latlng: [-22.85187, -43.24571],
                zoom: 17,
                minZoom: 12
            }),
            leafIcon = L.Icon.extend({
                options: {
                    shadowUrl: `${this.path}/booklet/css/images/shadow-church.png`,
                    iconSize: [100, 100],
                    shadowSize: [100, 70],
                    iconAnchor: [22, 94],
                    shadowAnchor: [4, 62],
                    popupAnchor: [-3, -66]
                }
            }),
            church = new leafIcon({ iconUrl: `${this.path}/booklet/css/images/church.png` }),
            link = '<button onclick="' + this.layerGroup({ map }) + '">Lista de Membros</button>',
            popup = `Igeja Batista do Amor de Deus<br>Pr. Presidente Edmilson<br>Rua da Paz, 11 - Parque União - Maré / RJ<br>${link}`

        L.marker([-22.85187, -43.24571], { icon: church }).addTo(map).bindPopup(popup)
    }

    layerGroup() {
        const markerCluster  = new L.MarkerClusterGroup(),
            markerClusterAll = new L.MarkerClusterGroup()

        let families = []

        this.service.getGeojson()
            .then(geojson => {
                // for (let i of geojson) {
                //     families.push(i.properties.family)
                // }

                const markers   = {},
                    allMarker   = [],
                    groupLatlng = {}

                // Split for group
                // for (let i of geojson) {
                //     // const pathPhoto = 'booklet/css/images/photos'
                //     // const photoName = i.properties.iconUrl.split('/').pop()

                //     const latlng = i.geometry.coordinates,
                //         icon = L.icon({
                //             iconSize: [40, 40],
                //             iconAnchor: [9, 30],
                //             popupAnchor: [5, -30],
                //             iconUrl: i.properties.brasao
                //         }),
                //         name = i.properties.name.replace(' ',''),
                //         familyName = i.properties.family.split(' ').join('')

                //     groupLatlng[familyName] = { latlng: [ latlng[1], latlng[0] ], family: familyName }
                //     markers[name] = L.marker([ latlng[1], latlng[0] ], { icon }).bindPopup(i.properties.popupContent)

                //     allMarker.push(markerClusterAll.addLayer(L.marker([ latlng[1], latlng[0] ], { icon }).bindPopup(i.properties.popupContent)))
                // }

                // const allFamily = L.layerGroup(allMarker),
                //     layerGroups = {}

                // let g = {}
                // for (let i of geojson) {
                //     let name = i.properties.name.replace(' ',''),
                //         nameFamily = i.properties.family.replace(' ','')
                //     if (!layerGroups.hasOwnProperty(nameFamily)) {
                //         g[nameFamily] = new L.MarkerClusterGroup()
                //         layerGroups[nameFamily] = [ g[nameFamily].addLayer(markers[name]) ]
                //     }
                //     else {
                //         layerGroups[nameFamily].push(g[nameFamily].addLayer(markers[name]))
                //     }
                // }

                const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap'
                    }),
                    osmHOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France'
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
                    attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
                });

                layerControl.addBaseLayer(openTopoMap, "OpenTopoMap");

                this.#graphicDensity({ map, geojson })
                    .then((density) => {
                        layerControl.addOverlay(density, "Distritos")
                    })
                    .then(() => {
            //             layerControl.addOverlay(allFamily, 'All');

            //             for (let i in layerGroups) {
            //                 layerControl.addOverlay(
            //                     L.layerGroup(layerGroups[i]), `Family ${i}`
            //                 )
            //             }

            //             map.on(('overlayadd'), (e) => {
            //                 const checkboxs = e.target._controlCorners.topright.querySelectorAll('[type=checkbox]')
            //                 checkboxs.forEach((i) => {
            //                     i.onchange = (e) => {
            //                         /** Do not allow all selection with the filter */
            //                         const cName = e.target.nextSibling.innerText.trim(),
            //                             family = cName.split(' ').pop()
            //                         families.shift()
            //                         if (cName === 'Density Members' && i.checked) {
            //                             return map.flyTo([-22.81665, -43.25285], 11)
            //                         }
            //                         if (e.target.checked && cName !== 'All') {
            //                             checkboxs.forEach((i) => {
            //                                 if (i.nextSibling.innerText.trim() === 'All' && i.checked) {
            //                                     return alert('Uncheck the All option')
            //                                 }
            //                                 if (groupLatlng[family]) {
            //                                     map.flyTo(groupLatlng[family]['latlng'], 17)
            //                                 }
            //                             })
            //                         }
            //                         else if (e.target.checked && cName === 'All') {
            //                             checkboxs.forEach((i) => {
            //                                 if (i.nextSibling.innerText.trim() !== 'All' && i.checked && 'Density Members' !== i.nextSibling.innerText.trim()) {
            //                                     return alert(`Select only the All or ${i.nextSibling.innerText}`)
            //                                 }
            //                             })
            //                             map.flyTo([-22.81665, -43.25285], 11)
            //                         }
            //                     }
            //                 })
            //             })
                    })
            })
            .catch((err) => {
                alert(`No geojson files found (${err})`)
            })
    }

    getColorState(d) {
        if (d.distrito && !d.concelho)  return '#f3fd7e'
        if (d.concelho && !d.freguesia) return '#e18041'
        if (d.freguesia)                return '#d74222'
    }

    #graphicDensity({ map, geojson }) {
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
                return this.#addInteration({ map, statesData: _regions, style, density }).addTo(map)
            })
            .then((density) => density)
    }

    #getRegions({ distrito, concelho, freguesia }) {
        let file
        if (distrito == null && concelho == null) {
            file = `${this.path}/booklet/js/files/regions/georef-portugal-distrito.json`
            return this.service.getRegions({ file })
        }
        else if (distrito != null && concelho == null) {
            file = `${this.path}/booklet/js/files/regions/concelhos.json`
            return this.service.getRegions({ file })
                .then(data => data.features.filter((d) => {
                    const resp = (concelho == null && distrito === d.properties.dis_name)
                    return resp
                }))
        }
        else if (freguesia == null && concelho != null) {
            file = `${this.path}/booklet/js/files/regions/freguesias.json`
            return this.service.getRegions({ file })
                .then(data => data.filter((d) => {
                    if (concelho.toLowerCase() === d.properties.concelho.toLowerCase()) {
                        if (d.geometry.type === 'GeometryCollection') {
                            d.geometry.geometries.forEach((e, i) => {
                                if (e.type === 'Point') delete d.geometry.geometries[i]
                            })
                        }
                        return d.geometry
                    }
                }))
        }
    }

    #addInteration({ map, statesData, style, density }) {
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

                    this.#getRegions({ distrito, concelho, freguesia })
                        .then((data) => {
                            L.geoJson(data, { onEachFeature }).addTo(map)
                        })
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
                for (let i in props) {
                    if ('brasao' !== i.toLowerCase() && 'name' !== i.toLowerCase()) {
                        this._div.innerHTML += `<p>${i.toUpperCase()}: ${props[i].toUpperCase()}</p>`
                    }
                    else if ('name' === i.toLowerCase()) {
                        let name = props[i].split(' ')
                        let n = ''
                        for (let x = 0; x < name.length; x++) {
                            n += (x < 3) ? name[x] + " " : (x < 4) ? `<br>${name[x]}` : name[x] + ' '
                        }
                        this._div.innerHTML += `<p>${i.toUpperCase()}: ${n}</p>`
                    }
                    else {
                        if (props[i] !== 'nan') this._div.innerHTML += `<img src=${props[i]} alt="sem brasao" />`
                    }
                }
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
