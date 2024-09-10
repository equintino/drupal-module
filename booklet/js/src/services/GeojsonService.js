import { removeAccent } from "../lib/utils.js";
import Service from "./Service.js";

export default class GeojsonService extends Service {
    getRegions({ file, filter }) {
        return fetch(file).then((d) => {
            return d.json()
                .then((_d) => {
                    if (typeof(filter) === 'object') {
                        const data = (_d.type === 'FeatureCollection' ? _d.features : _d)
                        return data.filter((_e) => {
                            for (let i in filter) {
                                if (typeof(filter[i]) === 'object') {
                                    for (let _i in filter[i]) {
                                        return removeAccent(_e[i][_i]).toLowerCase().trim() === removeAccent(filter[i][_i]).toLowerCase().trim()
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
}
