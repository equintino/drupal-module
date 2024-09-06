import Service from "./Service.js";

export default class GeojsonService extends Service {
    path = '../modules/custom'
    listDisConFre

    initMap({ latlng, zoom, minZoom=null }) {
        var map = L.map('map').setView(latlng, zoom);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            minZoom,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        }).addTo(map);
        return map
    }

    getGeojson() {
        return new Promise((resolve, reject) => {
            return resolve(
                fetch(`${this.path}/booklet/js/files/regions/concelhos.json`)
                   .then((response) => response.json())
            )
        })
    }

    getRegions({ file }) {
        return fetch(file).then((d) => d.json())
    }

    getCenterMap() {
        return fetch(`${this.path}/booklet/js/files/regions/freguesias-metadata.json`)
            .then((response) => {
                return response.json()
            })
            .then((response) => {
                const coordinates = response[0].geometry.coordinates[0][0]
                return [coordinates[1], coordinates[0]]
            })
    }
}
