import { useState } from "react";
import MultiSelect from "@/components/commons/input/MultiSelect";

function TestPage() {
  const [tags, setTags] = useState([]);

  return (
    <>
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
