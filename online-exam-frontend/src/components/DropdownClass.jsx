import Select from 'react-select';

const options = [
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
