import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin para remover crossorigin de index.html y evitar bloqueos en Android WebView
const removeCrossoriginPlugin = () => {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/crossorigin/g, '');
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), removeCrossoriginPlugin()],
})
