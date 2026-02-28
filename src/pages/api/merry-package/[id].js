import { prisma } from "@/lib/prisma";

// API handler หลัก
export default async function handler(req, res) {
  // ดึง id จาก query string เช่น /api/package/3
  const { id } = req.query;

  // =========================
  // GET: ดึงข้อมูล package ตาม id
  // =========================
  if (req.method === "GET") {
    try {
      // ค้นหา package จาก id
      const pkg = await prisma.package.findUnique({
        where: { id: Number(id) }, // แปลง id เป็น number เพราะ prisma schema เป็น Int
        include: {
          // ดึง relation ชื่อ details มาด้วย
          details: {
            orderBy: { position: "asc" }, // เรียง detail ตาม position จากน้อยไปมาก
          },
        },
      });

      // ถ้าไม่เจอ package
      if (!pkg) {
        return res.status(404).json({ error: "Not found" });
      }

      // ส่งข้อมูลกลับ
      res.json(pkg);
    } catch (error) {
      // ถ้าเกิด error ระหว่าง query
      console.error(error);
      res.status(500).json({ error: "Fetch failed" });
    }
  }

  // =========================
  // PUT: อัปเดต package ตาม id
  // =========================
  if (req.method === "PUT") {
    try {
      // ดึงข้อมูลที่ส่งมาจาก frontend
      const { name, price, limit_matching, icon_url, details } = req.body;

      // อัปเดตข้อมูล package
      await prisma.package.update({
        where: { id: Number(id) }, // ระบุ id ที่ต้องการ update
        data: {
          name, // ชื่อ package
          price, // ราคา
          limit_matching, // limit การ match
          icon_url, // url icon
          details: {
            deleteMany: {}, // ลบ details เดิมทั้งหมดของ package นี้ก่อน
            create: details.map((d, index) => ({
              value: d.value, // ค่า detail
              position: index, // กำหนด position ใหม่ตามลำดับ array
            })),
          },
        },
      });

      // ส่งผลลัพธ์ success
      res.json({ success: true });
    } catch (error) {
      // ถ้า update ล้มเหลว
      console.error(error);
      res.status(500).json({ error: "Update failed" });
    }
  }

  // =========================
  // DELETE: ลบ package ตาม id
  // =========================
  if (req.method === "DELETE") {
    try {
      // ลบ package ตาม id
      await prisma.package.delete({
        where: { id: Number(id) }, // ระบุ id ที่ต้องการลบ
      });

      // ส่งผลลัพธ์ success
      res.json({ success: true });
    } catch (error) {
      // ถ้าลบไม่สำเร็จ เช่น id ไม่มีอยู่
      console.error(error);
      res.status(500).json({ error: "Delete failed" });
    }
  }
}