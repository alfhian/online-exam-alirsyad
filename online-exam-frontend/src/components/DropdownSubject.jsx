import Select from 'react-select';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import axios from 'axios';

const MySwal = withReactContent(Swal);

export default function SubjectSelect({ subject, setSubject }) {
	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);

	const fetchData = async () => {
		setLoading(true);
		try {
			const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/subjects/all`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				}
			})

			const newOptions = res.data?.data.map(item => ({
				value: item.id,
				label: `${item.name} - ${item.class_id}`
			}));

			setOptions(newOptions);
		} catch (err) {
			MySwal.fire({
        title: 'Error',
        text: 'Gagal mengambil data mata pelajaran.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
			console.log('Failed to fetch subject', err)
		}
	}

	useEffect(() => {
		fetchData();
	}, []);

  return (
    <Select
			options={options}
			value={options.find(opt => opt.value === subject)}
			onChange={(opt) => setSubject(opt?.value ?? null)}
			placeholder="Pilih Mata Pelajaran"
			className='w-full py-1 px-2 bg-white rounded-full'
			isClearable	
    />
  );
}
