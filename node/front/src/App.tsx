
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Node from "./containers/Node";
import "./App.css";

export default function App() {
  return ( 
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Node />} />
          <Route>404 Not Found!</Route>
        </Routes>
      </Router>
    </div>
  ); 
}
