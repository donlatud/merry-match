import { loginService } from "@/services/auth.service";

export const loginController = async (req, res) => {
  const { identifier, password } = req.body;

  const result = await loginService(identifier, password);

  return res.status(200).json({
    message: "Signed in successfully",
    ...result,
  });
};