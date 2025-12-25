(function () {
    'use strict';

    class AbstractView {
        constructor() {
            this.app = document.getElementById('root');
        }

        setTitle(title) {
            document.title = title;
        }

        render() {
            return
        }

        destroy() {
            return
        }
    }

    class BookDetailView extends AbstractView {
        constructor(appState) {
            super();
            this.appState = appState;
            this.setTitle('Описание книг');
        }

        
        render() {
            const main = document.createElement('div');
            main.innerHTML = `Описание книги`;
            this.app.innerHTML = '';
            this.app.append(main);
        }
    }

    class FavoritesView extends AbstractView {
        constructor() {
            super();
            this.setTitle('Избранные книг');
        }

        
        render() {
            const main = document.createElement('div');
            main.innerHTML = `Избранные книги`;
            this.app.innerHTML = '';
            this.app.append(main);
        }
    }

    class MainView extends AbstractView {
        state = {
            list: [],
            loading: false,
            searchQuery: undefined,
            offset: 0,
        }

        constructor(appState) {
            super();
            this.appState = appState;
            this.setTitle('Поиск книг');
        }

        
        render() {
            const main = document.createElement('div');
            main.innerHTML = `Число книг: ${this.appState.favorites.length}`;
            this.app.innerHTML = '';
            this.app.append(main);
        }
    }

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
            window.addEventListener('hashchange', this.route.bind(this));
            this.route();
        }

        route() {
            if (this.currentView) {
                this.currentView.destroy();
            }
            let cleanPath = location.hash.replace(/^#/, '');
            const view = this.routes.find((r) => r.path === cleanPath).view;
            this.currentView = new view(this.appState);
            this.currentView.render();
        }
    }

    new App();

})();
