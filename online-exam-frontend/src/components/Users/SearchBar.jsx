import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const SearchBar = ({ placeholder = "Search by fields..." }) => {
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
        params.set('page', '1'); // reset ke halaman pertama saat search berubah
        setSearchParams(params);
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(debounce);
  }, [input, setSearchParams]);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      className="w-full max-w-md px-4 py-2 border border-2 border-gray-200 rounded mb-4"
    />
  );
};

export default SearchBar;
