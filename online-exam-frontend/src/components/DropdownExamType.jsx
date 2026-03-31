import Select from 'react-select';

const options = [
  { value: 'REGULER', label: 'Reguler' },
  { value: 'REMEDIAL', label: 'Remedial' },
];

export default function ExamTypeSelect({ type, setType }) {
  return (
    <Select
			options={options}
			value={options.find(opt => opt.value === type)}
			onChange={(opt) => setType(opt?.value ?? null)}
			placeholder="Pilih Tipe Ujian"
			className='w-full py-1 px-2 bg-white rounded-full'
			isClearable
    />
  );
}
