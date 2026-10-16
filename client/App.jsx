import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';

// Componente principal. De momento solo muestra la navbar y el pie (Footer).
export default function App() {
  return (
    <>
      <Navbar />
      <main className="content"></main>
      <Footer />
    </>
  );
}
