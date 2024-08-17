import Service from '../services/Service.js'
import View from './../views/View.js'
import GeojsonController from './GeojsonController.js'

export default class Controller {
   view
   service

   constructor({ view, service }) {
      this.view = view
      this.service = service
   }

   static initializer() {
      const controller = new Controller({
         view: new View(),
         service: new Service()
      })
      controller.#geojson()
   }

   #geojson() {
      GeojsonController.initializer()
   }
}
