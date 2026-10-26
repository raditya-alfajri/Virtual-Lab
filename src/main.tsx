import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import Layout from './components/Layout'
import Home from './pages/home'
import LabList from './pages/LabList'
import ExperimentCatalog from './pages/ExperimentCatalog'
import ExperimentDetail from './pages/ExperimentDetail'
import LabPage from './pages/LabPage'
import DevEngine from './pages/DevEngine'


const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/lab', element: <LabList /> },
      { path: '/lab/:pelajaran', element: <ExperimentCatalog /> },
      { path: '/lab/:pelajaran/:id', element: <ExperimentDetail /> },
      { path: '/lab/:pelajaran/:id/mulai', element: <LabPage /> },
      ...(import.meta.env.DEV ? [{ path: '/dev/engine', element: <DevEngine /> }] : []),
    ],
  },
])


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)

