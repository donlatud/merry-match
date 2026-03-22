const validateLogin = (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    const error = new Error("Identifier and password are required");
    error.statusCode = 400;
    throw error;
  }
};

/**
 * ใช้กับ GET /api/profile/[id]
 * ตรวจว่า req.query.id มีค่าและเป็น string
 */
export const validateProfileId = (req) => {
  const id = req.query?.id;
  if (id == null || id === "" || typeof id !== "string") {
    const error = new Error("Profile id is required");
    error.statusCode = 400;
    throw error;
  }
};

export default validateLogin;