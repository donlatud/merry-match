import { useState } from "react";
import MultiSelectTest from "@/components/commons/input/MultiSelectTest";
import DatePicker from "@/components/commons/input/DatePicker";

function TestPage() {
  const [tags, setTags] = useState([]);
  const [hobbies, setHobbies] = useState([]);
  const [date, setDate] = useState("");
  console.log(date)

const handleSubmit = async () => {

  await fetch("/api/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hobbies: hobbies
    }),
  });

};

  return (
    <>
      <form
      onSubmit={handleSubmit}
      >
        <MultiSelectTest
          label="Keywords"
          placeholder="placeholder"
          value={tags}
          onChange={setTags}
          // error={true}
        />
        <DatePicker
value={date}
onChange={setDate}
 placeholder="Choose date" เปลี่ยน place holder
/>
      </form>
    </>
  );
}

export default TestPage;
