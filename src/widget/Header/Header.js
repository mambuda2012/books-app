import { DivComponent } from '../../shared/ui/DivComponent/DivComponent.js'

import './Header.css'
export class Header extends DivComponent {
    constructor(appState) {
        super()
        this.appState = appState
        this.element = document.createElement('header')
    }
    render() {
        this.element.innerHTML = ''
        this.element.classList.add('header')
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
		  `
        return this.element
    }
}
