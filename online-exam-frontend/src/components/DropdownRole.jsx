import Select from 'react-select';

const options = [
  { value: 'SISWA', label: 'Siswa' },
  { value: 'GURU', label: 'Guru' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function RoleSelect({ role, setRole }) {
  return (
    <Select
			options={options}
			value={options.find(opt => opt.value === role)}
			onChange={(opt) => setRole(opt?.value ?? null)}
			placeholder="Pilih Role"
			className='w-full py-1 px-2 bg-white rounded-full'
			isClearable
    />
  );
}
