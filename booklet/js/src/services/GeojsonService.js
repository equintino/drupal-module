import { removeAccent } from "../lib/utils.js";
import Service from "./Service.js";

export default class GeojsonService extends Service {
    getRegions({ file, filter, type }) {
        let arr = []
        return fetch(file).then((d) => {
            return d.json()
                .then((_d) => {
                    if (typeof(filter) === 'object') {
                        let data = (_d.type === 'FeatureCollection' ? _d.features : _d)
                        return data.filter((_e) => {
                            for (let i in filter) {
                                if (typeof(filter[i]) === 'object') {
                                    for (let _i in filter[i]) {
                                        if (_e[i][_i]) {
                                            return removeAccent(_e[i][_i]).toLowerCase().trim() === removeAccent(filter[i][_i]).toLowerCase().trim()
                                        }
                                    }
                                }
                            }
                        })
                    }
                    return _d
                }
            )
        })
    }

    /**
     * @file {string} the file geojson location
     * @filter {object}
     * @reverse {boolean} reverte coodenates
     */
    getGeojson({ file, filter, reverse }) {
        let arr = []
        return fetch(file).then((d) => {
            return d.json()
                .then((_d) => {
                    if (typeof(filter) === 'object') {
                        let data = (_d.type === 'FeatureCollection' ? _d.features : _d)
                        return data.filter((_e) => {
                            for (let i in filter) {
                                if (typeof(filter[i]) === 'object') {
                                    for (let _i in filter[i]) {
                                        if (_e[i][_i]) {
                                            return removeAccent(_e[i][_i]).toLowerCase().trim() === removeAccent(filter[i][_i]).toLowerCase().trim()
                                        }
                                    }
                                }
                            }
                        })
                    }
                    if (reverse) {
                        _d.features.forEach((coods) => {
                            if (coods.geometry.type === 'Polygon') {
                                let coodsRev = []
                                coods.geometry.coordinates.map((e) => {
                                    coodsRev.push(e.map((_e) => [ _e[1], _e[0] ]))
                                })
                                coods.geometry.coordinates = coodsRev
                            }
                            if (coods.geometry.type === 'Point') {
                                coods.geometry.coordinates = [
                                    coods.geometry.coordinates[1],
                                    coods.geometry.coordinates[0]
                                ]
                            }
                        })
                    }
                    return _d
                }
            )
        })
    }

    coordReverse(data) {
        return data.features.map((coods) => {
            if (coods.geometry.type === 'Polygon') {
                let coodsRev = []
                coods.geometry.coordinates.map((e) => {
                    coodsRev.push(e.map((_e) => [ _e[1], _e[0] ]))
                })
                coods.geometry.coordinates = coodsRev
            }
            if (coods.geometry.type === 'Point') {
                coods.geometry.coordinates = [
                    coods.geometry.coordinates[1],
                    coods.geometry.coordinates[0]
                ]
            }
            return coods
        })
    }
}
