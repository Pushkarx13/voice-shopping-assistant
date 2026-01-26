import React, { useState, useMemo, useEffect } from 'react';

// --- Configuration Data ---
const CATEGORIES = {
  Dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
  Produce: ['apple', 'banana', 'orange', 'tomato', 'onion', 'garlic', 'potato'],
  Bakery: ['bread', 'bagel', 'muffin', 'croissant'],
  Snacks: ['chips', 'chocolate', 'nuts', 'cookies']
};

const SMART_LOGIC = {
  substitutes: { 'milk': 'Almond Milk', 'bread': 'Whole Wheat Bread', 'sugar': 'Stevia' },
  seasonal: ['Watermelon (In Season)', 'Pumpkin (On Sale)', 'Strawberries (Fresh)']
};

export default function App() {
  const [list, setList] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [searchFilter, setSearchFilter] = useState({ query: '', maxPrice: null });

  // 1. Voice Recognition Setup (Multilingual Support)
  const recognition = useMemo(() => {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return null;
    const rec = new Speech();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US'; // Set to 'es-ES' or others for multilingual support
    return rec;
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('Listening for command...');
      setSearchFilter({ query: '', maxPrice: null }); // Reset search on new command
      setIsListening(true);
      recognition.start();
    }
  };

  if (recognition) {
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript.toLowerCase();
      setTranscript(text);
      processNLP(text);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
  }

  // 2. Advanced NLP Processor (Requirement 1, 3, 4)
  const processNLP = (cmd) => {
    // --- FEATURE: Voice-Activated Search (Requirement 4) ---
    if (cmd.includes('find') || cmd.includes('search') || cmd.includes('show')) {
      const priceMatch = cmd.match(/(?:under|below|less than)\s*(?:\$)?\s*(\d+)/);
      const queryItem = cmd.split(/(?:find|search|show)\s+/)[1]?.replace(/(?:under|below|less than).*/, '').trim();
      setSearchFilter({ 
        query: queryItem || '', 
        maxPrice: priceMatch ? parseInt(priceMatch[1]) : null 
      });
      return;
    }

    // --- FEATURE: Shopping List Management (Requirement 3) ---
    const qtyMatch = cmd.match(/\d+/);
    const qty = qtyMatch ? parseInt(qtyMatch[0]) : 1;

    // Detect "Remove" Intent
    if (cmd.includes('remove') || cmd.includes('delete') || cmd.includes('take off')) {
      const itemToRemove = cmd.split(/(?:remove|delete|take off)\s+/)[1]?.trim();
      if (itemToRemove) {
        setList(prev => prev.filter(i => !i.name.toLowerCase().includes(itemToRemove)));
        setSuggestion(`Removed ${itemToRemove}`);
      }
      return;
    }

    // Detect "Add" Intent (Flexible NLP Phrases - Requirement 1)
    const addPhrases = ['add', 'buy', 'need', 'want', 'put'];
    const trigger = addPhrases.find(p => cmd.includes(p));

    if (trigger) {
      let itemToAdd = cmd.split(new RegExp(`${trigger}\\s+`))[1]
                        ?.replace(/to my list|on the list|bottles|pieces|\d+/g, '')
                        .trim();
      
      if (itemToAdd) {
        addItemToList(itemToAdd, qty);
      }
    }
  };

  const addItemToList = (name, qty) => {
    // --- FEATURE: Automated Categorization (Requirement 3) ---
    const category = Object.keys(CATEGORIES).find(cat => 
      CATEGORIES[cat].some(keyword => name.includes(keyword))
    ) || 'General';

    const newItem = {
      id: Date.now(),
      name: name,
      qty: qty,
      category: category,
      price: Math.floor(Math.random() * 12) + 1 // Simulated price for filtering
    };

    setList(prev => [newItem, ...prev]);

    // --- FEATURE: Smart Suggestions (Requirement 2) ---
    if (SMART_LOGIC.substitutes[name]) {
      setSuggestion(`Substitute: Prefer ${SMART_LOGIC.substitutes[name]}?`);
    } else if (name.includes('milk')) {
      setSuggestion("Recommendation: You usually buy Bread with Milk.");
    } else {
      // Seasonal Suggestion
      const randomSeasonal = SMART_LOGIC.seasonal[Math.floor(Math.random() * SMART_LOGIC.seasonal.length)];
      setSuggestion(`Seasonal Deal: ${randomSeasonal}`);
    }
  };

  // Logic: Filtering the display based on search
  const filteredList = list.filter(item => {
    const matchesName = item.name.toLowerCase().includes(searchFilter.query.toLowerCase());
    const matchesPrice = searchFilter.maxPrice ? item.price <= searchFilter.maxPrice : true;
    return matchesName && matchesPrice;
  });

  return (
    <div style={styles.appWrapper}>
      <style>{animations}</style>
      
      <div style={styles.layout}>
        {/* COMMAND CONSOLE (Left) */}
        <section style={styles.panel}>
          <div className="glass-card" style={styles.hub}>
            <h1 style={styles.logo}>VOICE<span style={{color: '#00d2ff'}}>CART</span></h1>
            <div style={styles.divider}></div>
            
            <div style={styles.micContainer}>
              <button 
                onClick={toggleListening}
                className={isListening ? 'neon-pulse' : ''}
                style={{...styles.micBtn, backgroundColor: isListening ? '#ff4757' : '#00d2ff'}}
              >
                {isListening ? '⚡' : '🎤'}
              </button>
            </div>

            <div style={styles.consoleBox}>
              <span style={{color: '#4ade80'}}>$ system_status:</span> 
              <span style={{marginLeft: '10px', color: '#e2e8f0'}}>{transcript || 'READY'}</span>
            </div>

            {suggestion && (
              <div className="glass-card" style={styles.suggestionBox}>
                <span style={{color: '#fbbf24', fontWeight: 'bold'}}>!</span> {suggestion}
              </div>
            )}
          </div>
        </section>

        {/* INVENTORY MATRIX (Right) */}
        <section style={styles.panel}>
          <div className="glass-card" style={styles.matrix}>
            <div style={styles.matrixHeader}>
              <span style={{letterSpacing: '3px'}}>INVENTORY_MATRIX</span>
              {searchFilter.maxPrice && (
                <div style={styles.filterTag}>
                  UNDER ${searchFilter.maxPrice} <span onClick={() => setSearchFilter({query:'', maxPrice:null})} style={{cursor:'pointer', marginLeft:'8px'}}>×</span>
                </div>
              )}
            </div>

            <div style={styles.scrollArea}>
              {filteredList.map(item => (
                <div key={item.id} style={styles.row}>
                  <div style={styles.rowInfo}>
                    <span style={styles.qty}>{item.qty}x</span>
                    <span style={styles.name}>{item.name}</span>
                    <span style={styles.tag}>{item.category}</span>
                  </div>
                  <div style={styles.price}>${item.price}.00</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// --- CSS Animations ---
const animations = `
  @keyframes neon-pulse {
    0% { box-shadow: 0 0 10px #00d2ff; }
    50% { box-shadow: 0 0 40px #00d2ff, 0 0 80px rgba(0, 210, 255, 0.4); }
    100% { box-shadow: 0 0 10px #00d2ff; }
  }
  .neon-pulse { animation: neon-pulse 1.5s infinite ease-in-out; }
  .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
  }
  body { margin: 0; overflow: hidden; }
`;

// --- Stylesheet Object ---
const styles = {
  appWrapper: { width: '100vw', height: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"JetBrains Mono", monospace', color: '#e2e8f0' },
  layout: { display: 'flex', width: '90%', height: '80%', maxWidth: '1200px', gap: '40px' },
  panel: { flex: 1 },
  hub: { height: '100%', padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: '2.5rem', margin: 0, letterSpacing: '10px', color: '#fff' },
  divider: { width: '60px', height: '2px', background: '#00d2ff', margin: '20px 0 40px' },
  micContainer: { marginBottom: '50px' },
  micBtn: { width: '110px', height: '110px', borderRadius: '50%', border: 'none', color: 'white', fontSize: '40px', cursor: 'pointer', transition: '0.4s' },
  consoleBox: { width: '100%', background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '15px', fontSize: '0.8rem', border: '1px solid rgba(0, 210, 255, 0.2)' },
  suggestionBox: { marginTop: '25px', width: '100%', padding: '15px', fontSize: '0.75rem', color: '#fbbf24', textAlign: 'center' },
  matrix: { height: '100%', padding: '40px', display: 'flex', flexDirection: 'column' },
  matrixHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', marginBottom: '20px' },
  filterTag: { background: '#00d2ff', color: '#0a0f1e', padding: '3px 10px', borderRadius: '5px', fontWeight: 'bold' },
  scrollArea: { flex: 1, overflowY: 'auto' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' },
  rowInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  qty: { color: '#00d2ff', fontWeight: 'bold' },
  name: { textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '1px' },
  tag: { fontSize: '0.6rem', color: '#475569', border: '1px solid #475569', padding: '1px 6px', borderRadius: '3px' },
  price: { color: '#00d2ff', fontWeight: 'bold' }
};