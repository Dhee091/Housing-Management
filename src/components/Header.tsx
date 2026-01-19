/**
 * Header component
 * Navigation bar with logo and links to main pages
 */

import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo/Brand */}
        <Link to="/" className="text-2xl font-bold text-blue-600">
          🏠 NigiaApt
        </Link>

        {/* Navigation Links */}
        <div className="hidden sm:flex items-center gap-8">
          <Link
            to="/"
            className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            Browse Properties
          </Link>
          <Link
            to="/list-property"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            List Property
          </Link>
        </div>

        {/* Mobile Menu Icon Placeholder */}
        <div className="sm:hidden">
          <button className="text-gray-700 hover:text-blue-600">☰</button>
        </div>
      </nav>
    </header>
  );
}
