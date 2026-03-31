import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CustomDatePicker({ label, selectedDate, onChange }) {
  return (
    <>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <DatePicker
        selected={selectedDate}
        onChange={onChange}
        dateFormat="yyyy-MM-dd"
        minDate={new Date()}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
        placeholderText="Select a date"
      />
    </>
  );
}
