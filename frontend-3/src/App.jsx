import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MetaMaskAuth from "./components/MetaMaskAuth";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MetaMaskAuth />} />
      </Routes>
    </Router>
  );
};

export default App;
