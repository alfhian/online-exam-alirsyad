import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const getPages = (current, totalPages, maxVisible = 5) => {
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, current + half);

  if (end - start + 1 < maxVisible) {
    if (start === 1) end = Math.min(totalPages, start + maxVisible - 1);
    else if (end === totalPages) start = Math.max(1, end - maxVisible + 1);
  }

  const pages = [];
  for (let i = start; i <= end; i++) {
    if (i > 0 && i <= totalPages) pages.push(i);
  }

  const result = [];
  if (pages[0] > 1) {
    result.push(1);
    if (pages[0] > 2) result.push('...');
  }
  
  result.push(...pages);

  if (pages[pages.length - 1] < totalPages) {
    if (pages[pages.length - 1] < totalPages - 1) result.push('...');
    result.push(totalPages);
  }

  return result;
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

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center sm:justify-end gap-1 mt-8">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-emerald-300 transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-200"
        title="Previous Page"
      >
        <FaChevronLeft className="text-xs" />
      </button>

      <div className="flex items-center gap-1 mx-2">
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-10 text-center text-slate-400 font-bold">...</span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => goToPage(p)}
              className={`h-10 min-w-[40px] px-3 flex items-center justify-center rounded-xl font-bold text-sm transition-all
                ${
                  p === currentPage
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600'
                }
              `}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-emerald-300 transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-200"
        title="Next Page"
      >
        <FaChevronRight className="text-xs" />
      </button>
    </div>
  );
};

export default Paginate;
