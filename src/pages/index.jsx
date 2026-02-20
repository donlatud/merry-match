// pages/test-display.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const SCROLL_OFFSET_PX = 64;

export default function LandingPage() {
  const [testData, setTestData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTestData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/test");
      setTestData(response.data);
      console.log(response);
      console.log(testData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err.response?.data?.error || err.message || "โหลดข้อมูลไม่สำเร็จ",
      );
      setTestData([]);
    } finally {
      setLoading(false);
    }
  };

  // ให้ดึงข้อมูลทันทีที่ Component ถูกโหลด
  useEffect(() => {
    fetchTestData();
  }, []);

  const router = useRouter();
  // มาจากหน้าอื่นด้วย hash (/#why-merry-match) เลื่อนไป section (รอ loading เสร็จก่อน เพราะ section ถึงจะถูก render)
  useEffect(() => {
    if (loading) return;
    const fromRouter = router.asPath.split("#")[1];
    const fromWindow =
      typeof window !== "undefined"
        ? (window.location.hash || "").replace("#", "")
        : "";
    const hash = fromRouter || fromWindow;
    if (!hash || !["why-merry-match", "how-to-merry"].includes(hash)) return;
    const t = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        const top =
          el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 150);
    return () => clearTimeout(t);
  }, [router.asPath, loading]);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <NavBar />
      <main className="pt-13 lg:pt-22">
        {/* Hero */}
        <section
          id="hero"
          className="min-h-[80vh] flex items-center justify-center bg-utility-bg"
        >
          <div className="text-center text-utility-white">
            <h1 className="text-headline1">Make the first “Merry”</h1>
            <p className="mt-4 text-body1">
              New generation of online dating website
            </p>
            <button className="mt-6 rounded-xl bg-red-400 px-6 py-3 text-body2 hover:bg-red-500">
              Start Matching
            </button>
          </div>
        </section>

        {/* Why Merry Match */}
        <section id="why-merry-match" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-headline3 text-gray-900">Why Merry Match?</h2>
            <p className="mt-4 text-body2 text-gray-700">
              Merry Match is a new generation of online dating website for
              everyone.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-purple-300 p-6 text-white">
                Fast
              </div>
              <div className="rounded-2xl bg-purple-400 p-6 text-white">
                Secure
              </div>
              <div className="rounded-2xl bg-purple-500 p-6 text-white">
                Easy
              </div>
            </div>
          </div>
        </section>

        {/* How to Merry */}
        <section id="how-to-merry" className="py-20 bg-utility-bg">
          <div className="mx-auto max-w-6xl px-6 text-center text-white">
            <h2 className="text-headline3">How to Merry</h2>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="rounded-2xl bg-purple-700 p-6">
                Upload your photo
              </div>
              <div className="rounded-2xl bg-purple-700 p-6">
                Explore and like
              </div>
              <div className="rounded-2xl bg-purple-700 p-6">Get to know</div>
              <div className="rounded-2xl bg-purple-700 p-6">
                Start chatting
              </div>
            </div>
          </div>
        </section>

        {/* CTA - Call To Action */}
        <section id="cta" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-3xl bg-utility-linear p-16 text-center text-white">
              <h2 className="text-headline3">
                Let’s start finding <br /> and matching someone new
              </h2>
              <button className="mt-6 rounded-xl bg-white px-6 py-3 text-body2 text-gray-900">
                Start Matching
              </button>
            </div>
          </div>
        </section>
      </main>

      <h1 className="text-2xl font-bold mb-4">ข้อมูลจากตาราง Test</h1>

      {error && (
        <div
          className="mb-4 p-4 rounded-lg bg-red-100 text-red-800 border border-red-200"
          role="alert"
        >
          <p className="font-semibold">เกิดข้อผิดพลาด</p>
          <p>{error}</p>
        </div>
      )}

      <ul className="border rounded-lg p-4 bg-gray-50">
        {testData.length > 0 ? (
          testData.map((item) => (
            <li key={item.id} className="py-2 border-b last:border-0">
              <span className="ml-2 font-semibold text-red-500">
                Name: {item.name}
              </span>
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
      <Footer />
    </>
  );
}
