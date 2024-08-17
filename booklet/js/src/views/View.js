export default class View {
    page

    constructor() {
        this.#setPage()
    }

    #setPage() {
        this.page = document.URL.split('/').pop()
    }
}