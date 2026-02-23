import { useState } from "react";
import DatePicker from "@/components/commons/input/DatePicker";
import MultiSelect from "@/components/commons/input/MultiSelect";

function TestPage() {
  const [date, setDate] = useState("");
  const [tags, setTags] = useState([]);

  return (
    <>
      <DatePicker
        value={date}
        onChange={setDate}
        placeholder="Choose date"
        // error={true}
      />
      <MultiSelect
        label="Keywords"
        placeholder="placeholder"
        value={tags}
        onChange={setTags}
        // error={true}
      />
    </>
  );
}

export default TestPage;
