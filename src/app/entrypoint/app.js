import '../styles/reset.css'

import '../styles/global.css'

import BookDetailView from '../../pages/bookDetailView/bookDetail.js'
import FavoritesView from '../../pages/favorites/favorites.js'
import MainView from '../../pages/main/main.js'
class App {
    routes = [
        {
            path: '',
            view: MainView,
        },
        {
            path: 'favorites',
            view: FavoritesView,
        },
        {
            path: `book`,
            view: BookDetailView,
        },
    ]
    appState = {
        favorites: [],
    }
    constructor() {
        window.addEventListener('hashchange', this.route.bind(this))
        this.route()
    }

    route() {
        if (this.currentView) {
            this.currentView.destroy()
        }
        let cleanPath = location.hash.replace(/^#/, '')
        const view = this.routes.find((r) => r.path === cleanPath).view
        this.currentView = new view(this.appState)
        this.currentView.render()
    }
}

new App()
