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

    class DivComponent {
        constructor() {
            this.element = document.createElement('div');
        }
        render() {
            this.element;
        }
    }

    class Header extends DivComponent {
        constructor(appState) {
            super();
            this.appState = appState;
            this.element = document.createElement('header');
        }
        render() {
            this.element.innerHTML = '';
            this.element.classList.add('header');
            this.element.innerHTML = `
            <img src='src/assets/svg/logo.svg' />
            <nav>
                <ul class='menu'>
                    <li class='menu__item'>
                        <a href="#" class='item__link'>
                            <img src='src/assets/svg/search.svg' />
                            Поиск книг
                        </a>
                    </li>
                    <li class='menu__item'>
                        <a href="#favorites" class='item__link'>
                            <img src='src/assets/svg/favorites.svg' />
                            Избранное
                        </a>
                    </li>
                    <li class='menu__item'>
                        <a href="#" class='item__link'>
                          <div class="menu__counter">
														${this.appState.favorites.length}
													</div>
                        </a>
                    </li>
                </ul>
            <nav />
		  `;
            return this.element
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
            this.app.innerHTML = '';
            this.app.append(main);
            this.renderHeader();
        }
        renderHeader() {
            const header = new Header(this.appState).render();
            this.app.prepend(header);
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
