import './App.css'
import { Toolbar } from './components/Toolbar'
import { PdfViewer } from './components/PdfViewer'
import { SearchPanel } from './components/SearchPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { AnnotationToolbar } from './components/AnnotationToolbar'

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden relative">
        <AnnotationToolbar />
        <PdfViewer />
        <SearchPanel />
      </div>
      <SettingsPanel />
    </div>
  )
}

export default App
