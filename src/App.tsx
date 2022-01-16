import React from 'react';
import './App.scss';
import Home from './views/home/Home';
import BackendHandler from './components/backend-handler/BackendHandler';
import { Routes, Route, HashRouter } from 'react-router-dom';
import Setting from './views/setting/Setting';
import useWebContentsListener from './hooks/useWebContentsListener';
import Loader from './components/Loader/Loader';

const App = () => {
  const [loading, setLoading] = React.useState(false);

  useWebContentsListener({
    'toggle-loading': (newLoading: boolean) => {
      setLoading(() => newLoading);
    },
  });

  return (
    <>
      {/* router */}
      <HashRouter>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/setting" element={<Setting />} />
        </Routes>

        {/* backend handler */}
        <BackendHandler />
      </HashRouter>

      {loading && (
        <div className="loading-container">
          <Loader />
        </div>
      )}
    </>
  );
};

export default App;
