import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const getPages = (current, totalPages, maxVisible = 5) => {
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, current + half);

  if (end - start + 1 < maxVisible) {
    if (start === 1) end = Math.min(totalPages, start + maxVisible - 1);
    else if (end === totalPages) start = Math.max(1, end - maxVisible + 1);
  }

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  if (pages[0] > 1) pages.unshift('...');
  if (pages[pages.length - 1] < totalPages) pages.push('...');

  return pages;
};


const Paginate = ({ total, pageSize = 10, maxVisible = 5 }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = getPages(currentPage, totalPages, maxVisible);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="flex items-center justify-end gap-2 mt-6">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 py-2 rounded bg-gray-200 text-sm disabled:opacity-50"
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={`page-${p}`}
            onClick={() => goToPage(p)}
            disabled={p === currentPage}
            className={[`px-3 py-2 rounded text-sm ${
              p === currentPage
                ? 'bg-blue-600 text-white cursor-default opacity-70'
                : 'bg-gray-100 hover:bg-gray-200'
            }`,{ padding: '0 !important' }]}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 py-2 rounded bg-gray-200 text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default Paginate;
