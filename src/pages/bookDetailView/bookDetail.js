import AbstractView from '../../shared/view.js'

class BookDetailView extends AbstractView {
    constructor(appState) {
        super()
        this.appState = appState
        this.setTitle('Описание книг')
    }

    render() {
        const main = document.createElement('div')
        main.innerHTML = `Описание книги`
        this.app.innerHTML = ''
        this.app.append(main)
    }
}

export default BookDetailView
