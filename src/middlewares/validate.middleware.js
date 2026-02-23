const validateLogin = (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    const error = new Error("Identifier and password are required");
    error.statusCode = 400;
    throw error;
  }
};

export default validateLogin