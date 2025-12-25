import AbstractView from '../../shared/view.js'

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
        main.innerHTML = `Число книг: ${this.appState.favorites.length}`
        this.app.innerHTML = ''
        this.app.append(main)
    }
}

export default MainView
