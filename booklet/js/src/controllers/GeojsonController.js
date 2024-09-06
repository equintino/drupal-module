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
        return


        // file = `${this.path}/booklet/js/files/regions/distritos/missing-freguesias.json`

        function removeAccent(str) {
            return str.replace(/[AÁÀÃÂáàâã]/g,'a').replace(/[Çç]/g,'c').replace(/[ÉÈÊéèê]/g,'e').replace(/[ÍÌ]/g,'i').replace(/[ÓÒÕÔóòõô]/g,'o').replace(/[ÚÙúù]/g,'u').replace(/ /g,'').toLowerCase()
        }

        // const file = `${geojsonController.path}/booklet/js/files/geojson/missing.json`
        const prefix = `${geojsonController.path}/booklet/js/files/regions/concelhos/`
        const file = `${geojsonController.path}/booklet/js/files/regions/concelhos/moncao.json`
        // const file = `${geojsonController.path}/booklet/js/files/regions/freguesias.json`
        const file2 = `${geojsonController.path}/booklet/js/files/geojson/_portugal.json`

        const distritos  = []
        const concelhos  = []
        const freguesias = []
        const dis_con    = {}
        const newData    = []
        let newFre
        let filterDis    = 'Portalegre'
        let filterCon    = ''
        let _reg = {}
        _reg[filterDis] = filterCon !== '' ? { [filterCon]: [] } : {}

        const promise = new Promise((resolve, reject) => {
            resolve(
                fetch(file).then((data) => data.json())
                    .then((atual) => {
                        atual.forEach((e) => {
                            let dis = e.properties.distrito
                            let con = e.properties.concelho
                            if (dis === filterDis && filterCon && con === filterCon) {
                                newData.push(e)
                                freguesias.push(e.properties.freguesia)
                            }
                            else if (dis === filterDis) {
                                newData.push(e)
                            }
                            // if (!dis_con.hasOwnProperty(e.properties.distrito)) {
                            //     dis_con[e.properties.distrito] = {}
                            // }
                            // if (!dis_con[e.properties.distrito].hasOwnProperty(e.properties.concelho)) {
                            //     dis_con[e.properties.distrito][e.properties.concelho] = []
                            // }
                            // if (dis_con[e.properties.distrito][e.properties.concelho].indexOf(e.properties.freguesia) === -1) {
                            //     dis_con[e.properties.distrito][e.properties.concelho].push(e)
                            //     newData.push(e)
                            // }
                        })

                        fetch(file2).then((data) => data.json())
                            .then((d) => d.filter((e) => e.name === filterDis))
                            .then((d) => d[0].conselhos.filter((e) => filterCon !== "" ? e.name === filterCon : true))
                            .then((d) => {
                                let missing = []
                                d.forEach((_d) => {
                                    let _concelho    = _d.name
                                    let _freguesias  = _d.freguesias

                                    // let reg  = d[0].freguesias
                                    _freguesias.forEach((_data, i) => {
                                        _freguesias[i].distrito = filterDis
                                        _freguesias[i].concelho = _concelho
                                        // if (e.name !== _data.properties.freguesia) {
                                        //     console.log({
                                        //         con: _data.properties.dicofre,
                                        //         fre: _data.properties.freguesia,
                                        //         e
                                        //     })
                                        // }

                                        newData.map((e) => {
                                            if (e.properties.dicofre == _data.code) delete _freguesias[i]
                                        })

                                        // if (reg[i]) _reg[filterDis][filterCon].push(reg[i])


                                        // if (find) {
                                        //     console.log(d[0].freguesias[i])
                                        // }

                                            // console.log(
                                            //     _data.properties.dicofre,
                                            //     _data.properties.freguesia
                                            // )
                                            // if (freguesias.indexOf(e.name) === -1) {
                                            //     console.log(
                                            //         e.name
                                            //     )
                                            // }
                                            // local.forEach((_e) => {
                                            //     let dis = _e.properties.distrito
                                            //     let con = _e.properties.concelho
                                            //     let fre = _e.properties.freguesia
                                            //     console.log({
                                            //         dis,
                                            //         con,
                                            //         fre,
                                            //         e
                                            //     })
                                            // })

                                        // })
                                    })
                                    // console.log({
                                    //     newFre: d[0].freguesias.filter((e) => e.name),
                                    //     freguesias
                                    // })
                                    missing.push(_freguesias.filter((d) => d))
                                })
                                return missing
                            })
                            .then((reg) => {
                                reg.forEach((e) => {
                                    e.forEach((_e) => {
                                        fetch(`https://json.geoapi.pt/municipio/${_e.concelho}`).then((data) => data.json())
                                            .then((d) => {
                                                const newGeo = d.geojsons.freguesias.filter((_d) => _d.properties.Dicofre == _e.code)
                                                document.querySelector('#page').append(JSON.stringify(newGeo))
                                                console.log(
                                                    JSON.stringify(newGeo)
                                                    // d.geojsons.freguesias,
                                                    // e.code,
                                                    // filterCon
                                                )
                                            })
                                        // console.log(
                                        //     e.name
                                        // )
                                    })
                                })
                                // console.log({ reg, _reg })
                            })


                            //     d.conselhos.filter((e) => {
                            //     console.log(
                            //         e
                            //     )
                            // }))
                            //     e.conselhos.filter((e) => e.name === 'Águeda')))
                            // .then((i) => {
                            //     console.log(
                            //         i
                            //     )
                            // })


                        // console.log((
                        //     freguesias
                        // ))
                        // document.querySelector('#page').append(JSON.stringify(newData))





        //                 for (let dis in local) {
        //                     let _dis = removeAccent(dis)

        //                     for (let con in local[dis]) {
        //                         let _con = removeAccent(con)
        //                         let search = local[dis][con]
        //                         search.forEach((i) => {

        //                             return fetch(prefix + _con + '.json')
        //                                 .then((data) => data.json())
        //                                 .then((d) => d.filter((_d) => {
        //                                         // console.log(
        //                                         //     _d
        //                                         // )
        //                                         if (removeAccent(_d.properties.distrito) === _dis && removeAccent(_d.properties.concelho) === _con && _d.geometry.type === 'Polygon') {
        //                                             if (_d.properties.name.match(i) !== -1) {
        //                                                 return _d
        //                                             }
        //                                         //     // let fre = _d.properties.name.split(' ').pop()
        //                                         //     // console.log(
        //                                         //     //     partern
        //                                         //     // )
        //                                         }
        //                                 }))
        //                                 .then((resp) => {
        //                                     all.push(resp)
        //                                     document.querySelector('#page').append(JSON.stringify(resp))
        //                                 })
        //                         })
        //                     }
        //                 }
                })
            )
        })
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

        /** conferir a leitura do json */
        // this.service.getGeojson()
            // .then(() => {

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

                this.#graphicDensity({ map })
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

            // })
            // .catch((err) => {
            //     alert(`No geojson files found (${err})`)
            // })
    }

    getColorState(d) {
        if (d.distrito && !d.concelho)  return '#f3fd7e'
        if (d.concelho && !d.freguesia) return '#e18041'
        if (d.freguesia)                return '#d74222'
    }

    #graphicDensity({ map }) {
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
            file = `${this.path}/booklet/js/files/regions/_freguesias.json`
            // file = `${this.path}/booklet/js/files/regions/distritos/leiria.json`
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
