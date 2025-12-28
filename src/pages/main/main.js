import AbstractView from '../../shared/view.js'
import { Header } from '../../widget/Header/Header.js'

class MainView extends AbstractView {
    state = {
        list: [],
        loading: false,
        searchQuery: undefined,
        offset: 0,
    }

    constructor(appState) {
        super()
        this.appState = appState
        this.setTitle('Поиск книг')
    }

    render() {
        const main = document.createElement('div')
        this.app.innerHTML = ''
        this.app.append(main)
        this.renderHeader()
    }
    renderHeader() {
        const header = new Header(this.appState).render()
        this.app.prepend(header)
    }
}

export default MainView
