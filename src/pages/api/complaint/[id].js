export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== "GET") {
    return res.status(405).end();
  }

  if (!id) {
    return res.status(400).json({ error: "ID required" });
  }

  const pkg = await prisma.complaint.findUnique({
    where: { id: Number(id) },
  });

  if (!pkg) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(pkg);
}