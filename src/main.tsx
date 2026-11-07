import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import LabList from './pages/LabList'
import ExperimentCatalog from './pages/ExperimentCatalog'
import ExperimentDetail from './pages/ExperimentDetail'
import LabPage from './pages/LabPage'
import AboutAI from './pages/AboutAI'
import NotFound from './pages/NotFound'


const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/lab', element: <LabList /> },
      { path: '/lab/:subject', element: <ExperimentCatalog /> },
      { path: '/lab/:subject/:id', element: <ExperimentDetail /> },
      { path: '/lab/:subject/:id/mulai', element: <LabPage /> },
      { path: '/tentang-ai', element: <AboutAI /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
