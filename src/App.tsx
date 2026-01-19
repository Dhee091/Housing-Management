/**
 * Main App component with routing configuration
 *
 * Architectural Decision: Using React Router v6 for client-side routing
 * - Provides nested routing capabilities for future scalability
 * - Component-based route definitions for cleaner code
 * - Built-in hooks for navigation and route parameters
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ApartmentDetails from "./pages/ApartmentDetails";
import ListProperty from "./pages/ListProperty";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/apartment/:id" element={<ApartmentDetails />} />
            <Route path="/list-property" element={<ListProperty />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
