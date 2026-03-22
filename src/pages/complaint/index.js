import Image from "next/image";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import InputBar from "@/components/commons/input/InputBar";
import { PrimaryButton } from "@/components/commons/button/PrimaryButton";
import { useState } from "react";
import { merryToast } from "@/components/commons/toast/MerryToast";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { usePostComplaint } from "@/hooks/complaint/usePostComplaint";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

function ComplaintPage() {
  const [issue, setIssue] = useState("");
  const [desc, setDesc] = useState("");
  const [errors, setErrors] = useState({
    issue: "",
    desc: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const { createIssue } = usePostComplaint();

  // ✅ แยก validation function (reuse ได้)
  const validateIssue = (value) => {
    if (!value.trim()) return "Issue is required.";
    if (value.trim().length < 5)
      return "Issue must be at least 5 characters.";
    if (value.length > 100)
      return "Issue must be less than 100 characters.";
    return "";
  };

  const validateDesc = (value) => {
    if (!value.trim()) return "Description is required.";
    if (value.trim().length < 10)
      return "Please enter at least 10 characters.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ validate ทั้งหมดก่อน submit
    const issueError = validateIssue(issue);
    const descError = validateDesc(desc);

    setErrors({
      issue: issueError,
      desc: descError,
    });

    if (issueError || descError) return;

    try {
      setIsLoading(true);

      const data = { issue, description: desc };
      const success = await createIssue(data);

      if (!success) {
        merryToast.error(
          "Create Issue failed!",
          "Invalid data",
          <ExclamationCircleIcon className="size-10! text-red-400" />,
        );
        return;
      }

      merryToast.success(
        "Success!",
        "Create issue success!",
        <CheckCircleIcon className="size-10! text-green-500" />,
      );

      // reset
      setIssue("");
      setDesc("");
      setErrors({ issue: "", desc: "" });
    } catch (error) {
      merryToast.error(
        "Error",
        error.message,
        <ExclamationCircleIcon className="size-10! text-red-400" />,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="min-h-90vh flex items-center lg:h-screen pb-20">
        <div className="flex flex-col lg:flex-row-reverse py-10 px-4 gap-10 lg:gap-0 lg:justify-between lg:max-w-280 w-full lg:mx-auto lg:items-center z-1">
          <Image
            src="/images/login/login-hero-image.svg"
            alt="Login hero"
            width={177}
            height={266}
            className="lg:w-112.5 lg:h-169.25 mx-auto lg:mx-0"
          />

          <div className="lg:mx-0 mx-auto lg:my-auto max-w-137">
            <span className="text-beige-700 text-body4">COMPLAINT</span>
            <h2 className="lg:text-headline2 text-purple-500 mb-10 text-headline3">
              If you have any trouble <br />
              Don’t be afraid to tell us!
            </h2>

            <form
              onSubmit={handleSubmit}
              className="bg-(--color-brown-100) gap-10 flex flex-col"
            >
              {/* Issue */}
              <div>
                <label className="block text-sm mb-1">Issue</label>
                <InputBar
                  value={issue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setIssue(value);

                    setErrors((prev) => ({
                      ...prev,
                      issue: validateIssue(value),
                    }));
                  }}
                  placeholder="Enter your issue."
                  error={errors.issue}
                />

                {errors.issue && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.issue}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm mb-1">Description</label>

                <textarea
                  value={desc}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDesc(value);

                    setErrors((prev) => ({
                      ...prev,
                      desc: validateDesc(value),
                    }));
                  }}
                  placeholder="Please describe ..."
                  className={`
                    h-49 w-full border rounded-lg px-3 py-3
                    outline-none focus:border-purple-500
                    ${
                      errors.desc
                        ? "border-red-500"
                        : "border-gray-400"
                    }
                  `}
                  maxLength={500}
                />

                <p className="text-sm text-gray-500">
                  {desc.length}/500
                </p>

                {errors.desc && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.desc}
                  </p>
                )}
              </div>

              {/* Submit */}
              <PrimaryButton
                type="submit"
                className="lg:w-25.5 bg-red-500 text-white rounded-full py-3 mb-4 cursor-pointer"
                disabled={
                  isLoading ||
                  !issue.trim() ||
                  !desc.trim() ||
                  errors.issue ||
                  errors.desc
                }
              >
                Submit
              </PrimaryButton>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ComplaintPage;