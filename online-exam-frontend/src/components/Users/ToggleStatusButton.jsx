import { useState } from 'react';
import { MdToggleOn, MdToggleOff } from 'react-icons/md';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import PropTypes from 'prop-types';

const MySwal = withReactContent(Swal);

const ToggleStatusButton = ({ label, isActive, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    const result = await MySwal.fire({
      title: `Ubah status ${label}?`,
      text: `Status akan diubah menjadi ${isActive ? 'Inactive' : 'Active'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, ubah!',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await onConfirm(!isActive);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1 text-sm font-medium rounded focus:outline-none hover:bg-gray-100 transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isActive ? (
        <MdToggleOn className="text-green-500 text-2xl" />
      ) : (
        <MdToggleOff className="text-gray-400 text-2xl" />
      )}
      <span>{loading ? 'Updating...' : isActive ? 'Active' : 'Inactive'}</span>
    </button>
  );
};

ToggleStatusButton.propTypes = {
  label: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default ToggleStatusButton;
