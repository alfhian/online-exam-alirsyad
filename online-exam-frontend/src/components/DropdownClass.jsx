import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import api from '../api/axiosConfig';

const fallbackOptions = [
  { value: '10AK', label: 'Kelas 10 AK' },
  { value: '10TKJ', label: 'Kelas 10 TKJ' },
  { value: '10AP', label: 'Kelas 10 AP' },
  { value: '11AK', label: 'Kelas 11 AK' },
  { value: '11TKJ', label: 'Kelas 11 TKJ' },
  { value: '11AP', label: 'Kelas 11 AP' },
  { value: '12AK', label: 'Kelas 12 AK' },
  { value: '12TKJ', label: 'Kelas 12 TKJ' },
  { value: '12AP', label: 'Kelas 12 AP' },
];

export default function ClassSelect({ classes, setClasses }) {
  const [classRows, setClassRows] = useState([]);

  useEffect(() => {
    let isMounted = true;

    api.get('/classes/all')
      .then((res) => {
        if (isMounted) setClassRows(res.data?.data || []);
      })
      .catch(() => {
        if (isMounted) setClassRows([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const options = useMemo(() => {
    if (!classRows.length) return fallbackOptions;
    return classRows.map((item) => ({
      value: item.id,
      label: item.name || item.id,
    }));
  }, [classRows]);

  return (
    <Select
            options={options}
            value={options.find(opt => opt.value === classes)}
            onChange={(opt) => setClasses(opt?.value ?? null)}
            placeholder="Pilih Kelas"
            className="w-full"
            classNamePrefix="app-select"
            isClearable
    />
  );
}
