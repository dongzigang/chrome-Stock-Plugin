import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import app from './components/app.vue'
joinContent(app)
injectJsInsert()

function joinContent (element) {
	const div = document.createElement('div')
	div.id = 'joinContentApp'
	document.body.appendChild(div)
	console.log(div)
	const App = createApp(element)
  App.use(ElementPlus)
  App.mount('#joinContentApp')
}

function injectJsInsert () {
	document.addEventListener('readystatechange', () => {
		const injectPath = 'js/inject.js'
		const script = document.createElement('script')

		script.setAttribute('type', 'text/javascript')
		script.src = chrome.extension.getURL(injectPath)
		document.body.appendChild(script)
	})
}
