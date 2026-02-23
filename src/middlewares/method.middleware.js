export const allowMethods = (methods = []) => (req, res) => {
  if (!methods.includes(req.method)) {
    const error = new Error("Method not allowed");
    error.statusCode = 405;
    throw error;
  }
};