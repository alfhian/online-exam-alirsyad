import Select from 'react-select';

const options = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
];

export default function GenderSelect({ gender, setGender }) {
  return (
    <Select
			options={options}
			value={options.find(opt => opt.value === gender)}
			onChange={(opt) => setGender(opt?.value ?? null)}
			placeholder="Pilih Jenis Kelamin"
			className='w-full py-1 px-2 bg-white rounded-full'
			isClearable
    />
  );
}
