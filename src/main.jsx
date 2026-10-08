import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';

// No StrictMode: the 3D scene owns a WebGL context and must be created exactly once per mount.
createRoot(document.getElementById('root')).render(<App />);
