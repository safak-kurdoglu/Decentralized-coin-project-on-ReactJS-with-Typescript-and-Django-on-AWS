
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Wallet from "./containers/Wallet";
import Header from "./containers/Header";
import "./App.css";

export default function App() {

  return ( 
    <div className="App">
      <Router>
        <Header/>
        <Routes>
          <Route path="/" element={<Wallet />} />
          <Route>404 Not Found!</Route>
        </Routes>
      </Router>
    </div>
  ); 
}
