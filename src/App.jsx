import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Dashboard from './paginas/Dashboard';
import Equipamentos from './paginas/Equipamentos';
import EquipamentoDetalhes from './paginas/EquipamentoDetalhes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/equipamentos" element={<Equipamentos />} />
        <Route path="/equipamentos/:id" element={<EquipamentoDetalhes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;