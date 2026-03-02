import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const complaintId = id;
    try {
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      if (!complaint) {
        return res.status(404).json({ message: "Not found" });
      }

      return res.status(200).json(complaint);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
  if (req.method === "PATCH") {
    const { status } = req.body;
    const complaintId = id;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    try {
      let updateData = { status };

      if (status === "resolved") {
        updateData.resolvedAt = new Date();
      }

      if (status === "cancelled") {
        updateData.cancelledAt = new Date();
      }

      const updated = await prisma.complaint.update({
        where: { id: complaintId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      return res.status(200).json(updated);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: "Update failed" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
