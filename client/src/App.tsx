import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BoardsHome from './pages/BoardsHome';
import BoardPage from './pages/BoardPage';
import './App.css';

const App = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<BoardsHome />} />
        <Route path="/board/:boardId" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
