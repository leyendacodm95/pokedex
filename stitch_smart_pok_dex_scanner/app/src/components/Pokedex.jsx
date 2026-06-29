import React, { useState } from 'react';
import ResultModal from './ResultModal';

function Pokedex({ collection, onDelete, language, onChangeLanguage }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [sortBy, setSortBy] = useState('date_desc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortedCollection = [...collection].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'id_asc') return a.id - b.id;
    return 0;
  });

  const filteredCollection = sortedCollection.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="px-margin-mobile pb-32 max-w-7xl mx-auto w-full relative z-10 pt-16">
      {/* Background Shader */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#121212]"></div>

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-30 bg-white/10 dark:bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg px-margin-mobile py-unit">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto h-16">
          <h1 className="font-headline-md text-headline-md font-bold text-secondary-fixed">PokéScan</h1>
          <div className="flex gap-4">
            <div 
              onClick={() => onChangeLanguage(language === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1.5 px-3 py-1.5 glass-panel rounded-full hover:bg-white/5 transition-colors cursor-pointer select-none text-secondary-fixed"
            >
              <span className="material-symbols-outlined text-secondary-fixed text-lg">language</span>
              <span className="text-secondary-fixed text-xs font-bold font-data-num">{language.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Glassmorphic Search Bar */}
      <div className="mt-stack-md pt-8">
        <div className="glass-search rounded-full px-4 h-12 flex items-center transition-all duration-300">
          <span className="material-symbols-outlined text-secondary-container mr-3">search</span>
          <input 
            className="bg-transparent border-none outline-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant/50 font-body-md" 
            placeholder={language === 'en' ? "Search in your collection..." : "Buscar en tu colección..."} 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Collection Summary */}
      <div className="mt-stack-md flex justify-between items-center mb-4">
        <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
          {language === 'en' ? `Registered Pokémon: ${collection.length}` : `Pokémon Registrados: ${collection.length}`}
        </p>
        
        {/* Sort Menu Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 active:scale-95 transition-all text-on-surface-variant hover:text-secondary-fixed"
          >
            <span className="material-symbols-outlined text-[24px]">sort</span>
          </button>
          
          {showSortMenu && (
            <div className="absolute right-0 top-12 w-48 glass-panel rounded-xl shadow-2xl overflow-hidden z-40 border border-white/20">
              <div 
                onClick={() => { setSortBy('date_desc'); setShowSortMenu(false); }}
                className={`px-4 py-3 text-sm cursor-pointer hover:bg-white/10 transition-colors ${sortBy === 'date_desc' ? 'text-secondary-fixed font-bold bg-white/5' : 'text-on-surface'}`}
              >
                {language === 'en' ? "Newest First" : "Más recientes"}
              </div>
              <div 
                onClick={() => { setSortBy('date_asc'); setShowSortMenu(false); }}
                className={`px-4 py-3 text-sm cursor-pointer hover:bg-white/10 transition-colors border-t border-white/5 ${sortBy === 'date_asc' ? 'text-secondary-fixed font-bold bg-white/5' : 'text-on-surface'}`}
              >
                {language === 'en' ? "Oldest First" : "Más antiguos"}
              </div>
              <div 
                onClick={() => { setSortBy('name_asc'); setShowSortMenu(false); }}
                className={`px-4 py-3 text-sm cursor-pointer hover:bg-white/10 transition-colors border-t border-white/5 ${sortBy === 'name_asc' ? 'text-secondary-fixed font-bold bg-white/5' : 'text-on-surface'}`}
              >
                {language === 'en' ? "Name (A-Z)" : "Nombre (A-Z)"}
              </div>
              <div 
                onClick={() => { setSortBy('id_asc'); setShowSortMenu(false); }}
                className={`px-4 py-3 text-sm cursor-pointer hover:bg-white/10 transition-colors border-t border-white/5 ${sortBy === 'id_asc' ? 'text-secondary-fixed font-bold bg-white/5' : 'text-on-surface'}`}
              >
                {language === 'en' ? "Pokédex Number" : "Número Pokédex"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredCollection.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-on-surface-variant">
            {language === 'en' ? "No Pokémon found. Scan some!" : "No se encontraron Pokémon. ¡Escanea algunos!"}
          </div>
        ) : (
          filteredCollection.map((pokemon) => {
            const date = new Date(pokemon.date);
            const locale = language === 'en' ? 'en-US' : 'es-ES';
            const dateStr = `${date.getDate()} ${date.toLocaleString(locale, { month: 'short' })} ${date.getFullYear()}`;
            
            return (
              <div 
                key={pokemon.id} 
                onClick={() => setSelectedPokemon(pokemon)}
                className="glass-panel rounded-xl p-3 pokemon-card-glow flex flex-col items-center cursor-pointer relative"
              >
                {/* Botón Eliminar - Fuera de la imagen, más grande */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevenir que se abra el modal de detalles
                    const confirmMsg = language === 'en' 
                      ? `Do you want to delete ${pokemon.name.toUpperCase()} from your collection?`
                      : `¿Deseas eliminar a ${pokemon.name.toUpperCase()} de tu colección?`;
                    if (window.confirm(confirmMsg)) {
                      onDelete(pokemon.id);
                    }
                  }}
                  className="absolute -top-2 -right-2 w-9 h-9 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all active:scale-95 z-20 shadow-[0_4px_15px_rgba(220,38,38,0.5)] flex items-center justify-center border border-white/20"
                  title={language === 'en' ? "Delete Pokémon" : "Eliminar Pokémon"}
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>

                <div className="relative w-full aspect-square bg-white/5 rounded-lg overflow-hidden mb-3 flex items-center justify-center">
                  <img 
                    src={pokemon.image} 
                    alt={pokemon.name}
                    className="w-full h-full object-contain p-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                  />
                </div>
                <div className="w-full">
                  <h3 className="font-headline-md text-[16px] leading-tight text-on-surface truncate capitalize">{pokemon.name}</h3>
                  <div className="flex items-center mt-1">
                    <span className="material-symbols-outlined text-[14px] text-secondary-container mr-1">calendar_today</span>
                    <p className="font-label-caps text-[10px] text-on-surface-variant">{dateStr}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {selectedPokemon && (
        <ResultModal 
          pokemon={selectedPokemon} 
          onClose={() => setSelectedPokemon(null)} 
          showSave={false} 
          language={language}
        />
      )}
    </main>
  );
}

export default Pokedex;
