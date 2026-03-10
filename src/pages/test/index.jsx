import { useState } from "react";
import MultiSelectTest from "@/components/commons/input/MultiSelectTest";

function TestPage() {
  const [tags, setTags] = useState([]);
  const [hobbies, setHobbies] = useState([]);

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
      </form>
    </>
  );
}

export default TestPage;
