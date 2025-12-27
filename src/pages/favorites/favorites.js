import AbstractView from '../../shared/view.js'

class FavoritesView extends AbstractView {
    constructor() {
        super()
        this.setTitle('Избранные книг')
    }

    render() {
        const main = document.createElement('div')
        main.innerHTML = `Избранные книги`
        this.app.innerHTML = ''
        this.app.append(main)
    }
}

export default FavoritesView
