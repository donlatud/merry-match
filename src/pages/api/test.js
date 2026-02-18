import { prisma } from '@/lib/prisma'

export default async function handler(req, res) {
  try {
    // เปลี่ยนจาก prisma.user เป็น prisma.test
    const allTestData = await prisma.test.findMany()

    return res.status(200).json(allTestData)
  } catch (error) {
    return res.status(500).json({ error: "ดึงข้อมูลจากตาราง test ล้มเหลว" })
  }
}