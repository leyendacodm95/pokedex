import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Scanner from './components/Scanner';
import Pokedex from './components/Pokedex';
import BottomNav from './components/BottomNav';

function App() {
  const [collection, setCollection] = useState([]);
  const [language, setLanguage] = useState(() => localStorage.getItem('pokedex_language') || 'es');

  useEffect(() => {
    const saved = localStorage.getItem('pokedex_collection');
    if (saved) {
      try {
        setCollection(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse collection", e);
      }
    }
  }, []);

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('pokedex_language', newLang);
  };

  const saveToCollection = (pokemon) => {
    const isAlreadySaved = collection.some(p => p.id === pokemon.id);
    if (!isAlreadySaved) {
      const newCollection = [...collection, { ...pokemon, date: new Date().toISOString() }];
      setCollection(newCollection);
      localStorage.setItem('pokedex_collection', JSON.stringify(newCollection));
    }
  };

  const deleteFromCollection = (pokemonId) => {
    const newCollection = collection.filter(p => p.id !== pokemonId);
    setCollection(newCollection);
    localStorage.setItem('pokedex_collection', JSON.stringify(newCollection));
  };

  return (
    <Router>
      <div className="flex flex-col h-screen overflow-y-auto overflow-x-hidden">
        <div className="neon-frame"></div>
        <Routes>
          <Route path="/" element={<Navigate to="/scanner" replace />} />
          <Route path="/scanner" element={<Scanner onSave={saveToCollection} language={language} onChangeLanguage={changeLanguage} />} />
          <Route path="/collection" element={<Pokedex collection={collection} onDelete={deleteFromCollection} language={language} onChangeLanguage={changeLanguage} />} />
        </Routes>
        <BottomNav language={language} />
      </div>
    </Router>
  );
}

export default App;
