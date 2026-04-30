import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const SearchBar = ({ placeholder = "Cari data..." }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('search') || '');

  useEffect(() => {
    setInput(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      const currentSearch = searchParams.get('search') || '';
      if (input !== currentSearch) {
        const params = new URLSearchParams(searchParams);
        if (input.trim()) {
          params.set('search', input);
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        setSearchParams(params);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [input, setSearchParams]);

  return (
    <div className="relative group max-w-md w-full mb-5">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <FaSearch className="text-slate-400 text-[10px] transition-colors group-focus-within:text-emerald-500" />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="block w-full pl-9 pr-3 py-2 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-400"
      />
      {input && (
        <button
          onClick={() => setInput('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span className="text-sm font-medium">×</span>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
