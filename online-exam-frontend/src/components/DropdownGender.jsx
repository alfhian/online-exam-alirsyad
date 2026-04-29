import Select from 'react-select';

const options = [
  { value: 'L', label: 'Laki-laki (L)' },
  { value: 'P', label: 'Perempuan (P)' },
];

export default function GenderSelect({ gender, setGender }) {
  return (
    <Select
			options={options}
			value={options.find(opt => opt.value === gender)}
			onChange={(opt) => setGender(opt?.value ?? null)}
			placeholder="Pilih Jenis Kelamin"
      className="w-full"
      classNamePrefix="app-select"
			isClearable
    />
  );
}
