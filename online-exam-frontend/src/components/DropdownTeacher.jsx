import { useState, useEffect } from 'react';
import Select from 'react-select';
import api from '../api/axiosConfig';

export default function TeacherSelect({ teacherId, setTeacherId }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/role', {
          params: { role: 'GURU', limit: 100 }
        });
        const options = (res.data?.data || []).map(t => ({
          value: t.id,
          label: t.name
        }));
        setTeachers(options);
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  return (
    <Select
      options={teachers}
      value={teachers.find(opt => opt.value === teacherId)}
      onChange={(opt) => setTeacherId(opt?.value ?? null)}
      placeholder="Pilih Guru Pengampu"
      className="w-full"
      classNamePrefix="app-select"
      isLoading={loading}
      isClearable
    />
  );
}
