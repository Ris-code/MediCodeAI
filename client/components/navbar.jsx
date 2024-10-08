import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Search, Bell, User, Brain } from 'lucide-react';

const Navbar = () => {
  const router = useRouter();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'problem', icon: Brain, label: 'Problem', path: '/questions' },
    { id: 'search', icon: Search, label: 'Search', path: '/search' },
    { id: 'notifications', icon: Bell, label: 'Notifications', path: '/notifications' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="bg-gray-900 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold">
          <span className="text-blue-500">Medi</span>CodeAI
        </Link>
        <ul className="flex items-center space-x-4">
          {navItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.path}
                className={`flex items-center p-2 rounded-lg transition-all duration-300 ease-in-out
                  ${
                    router.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
              >
                <item.icon className="w-5 h-5 mr-1" />
                <span className="text-sm">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;