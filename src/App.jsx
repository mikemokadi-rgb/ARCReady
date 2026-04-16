import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './Components/Navbar';
import { Footer } from './Components/Footer';
import { HomePage } from './Pages/HomePage';
import { AssessmentPage } from './Pages/AssessmentPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
