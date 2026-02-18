// pages/test-display.js
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function TestPage() {
  const [testData, setTestData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTestData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get('/api/test')
      setTestData(response.data) 
      console.log(response)
      console.log(testData)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err.response?.data?.error || err.message || "โหลดข้อมูลไม่สำเร็จ")
      setTestData([])
    } finally {
      setLoading(false)
    }
  }

  // ให้ดึงข้อมูลทันทีที่ Component ถูกโหลด
  useEffect(() => {
    fetchTestData()
  }, [])

  if (loading) return <p>กำลังโหลดข้อมูล...</p>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">ข้อมูลจากตาราง Test</h1>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-100 text-red-800 border border-red-200" role="alert">
          <p className="font-semibold">เกิดข้อผิดพลาด</p>
          <p>{error}</p>
        </div>
      )}

      <ul className="border rounded-lg p-4 bg-gray-50">
        {testData.length > 0 ? (
          testData.map((item) => (
            <li key={item.id} className="py-2 border-b last:border-0">
              <span className="ml-2 font-semibold text-red-500">Name: {item.name}</span>
            </li>
          ))
        ) : (
          <p>{error ? "ไม่สามารถโหลดข้อมูลได้" : "ไม่มีข้อมูลในตาราง"}</p>
        )}
      </ul>

      <button 
        onClick={fetchTestData}
        className="mt-4 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
      >
        Refresh Data
      </button>
    </div>
  )
}