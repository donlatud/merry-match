import { useEffect, useState } from "react";
import axios from "axios";

export function useGetUsername() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsername() {
      try {
        const res = await axios.get("/api/admin/complaints/username");
        setData(res.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsername();
  }, []);

  return { data, loading, error };
}