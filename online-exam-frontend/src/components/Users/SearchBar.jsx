import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const SearchBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const debounce = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (input) {
        params.set('search', input);
        params.set('page', '1'); // reset ke halaman pertama
      } else {
        params.delete('search');
      }
      setSearchParams(params);
    }, 500); // debounce 500ms

    return () => clearTimeout(debounce);
  }, [input]);

  return (
    <input
      type="text"
      placeholder="Search by fields..."
      value={input}
      onChange={(e) => setInput(e.target.value)}
      className="w-full max-w-md px-4 py-2 border border-2 border-gray-200 rounded mb-4"
    />
  );
};

export default SearchBar;
