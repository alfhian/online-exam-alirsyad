import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import api from '../api/axiosConfig';

export default function ClassSelect({ classes, setClasses }) {
  const [classRows, setClassRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    api.get('/classes/all')
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : res.data?.data;
        if (isMounted) setClassRows(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (isMounted) setClassRows([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const options = useMemo(() => {
    return classRows.map((item) => ({
      value: item.id,
      label: item.name || item.id,
      className: item.name || item.id,
    }));
  }, [classRows]);

  return (
    <Select
            options={options}
            value={options.find(opt => opt.value === classes)}
            onChange={(opt) => setClasses(opt?.value ?? null, opt?.className ?? "")}
            placeholder="Pilih Kelas"
            className="w-full"
            classNamePrefix="app-select"
            isLoading={loading}
            isClearable
            noOptionsMessage={() => loading ? "Memuat kelas..." : "Belum ada data kelas"}
    />
  );
}
