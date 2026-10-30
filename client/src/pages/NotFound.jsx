import { Link } from 'react-router-dom';
import { Button } from '../components/ui.jsx';

export default function NotFound() {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"><p className="font-display text-8xl">404</p><p className="text-muted">That page doesn't exist.</p><Link to="/"><Button>Back to home</Button></Link></div>;
}
