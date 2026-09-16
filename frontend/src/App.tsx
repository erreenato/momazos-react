import './App.css'
import { Navbar } from './components/NavBar';
import { HomeView} from './views/HomeView';

function App() {
  return (
    <div>
      <Navbar />
      <main>
        <HomeView />
      </main>
    </div>
  );
}

export default App
