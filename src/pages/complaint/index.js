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
  const [error, setError] = useState("");

  const { createIssue } = usePostComplaint();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!issue || !desc) {
      const msg = "Issue and Description are required!";
      setError(msg);
      merryToast.error(
        "Missing information!",
        msg,
        <ExclamationCircleIcon className="size-10! text-red-400" />,
      );
      return;
    }
    try {
      const data = { issue, description: desc };
      const success = await createIssue(data);
      console.log(success);
      if (!success) {
        const msg = "Invalid issue or description";
        merryToast.error(
          "Create Issue failed!",
          msg,
          <ExclamationCircleIcon className="size-10! text-red-400" />,
        );
        return;
      }
      merryToast.success(
        "Success!",
        "Create issue success!",
        <CheckCircleIcon className="size-10! text-green-500" />,
      );
    } catch (error) {
      console.log(error);
      const msg = error.message;
      setError(msg);
      merryToast.error(
        "Error",
        msg,
        <ExclamationCircleIcon className="size-10! text-red-400" />,
      );
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
            className="lg:w-112.5  lg:h-169.25 mx-auto lg:mx-0"
          />
          <div className="lg:mx-0 mx-auto lg:my-auto max-w-137">
            <span className="text-beige-700 text-body4 ">COMPLAINT</span>
            <h2 className="text-headline2 text-purple-500 mb-10">
              If you hav any trouble Don’t be afraid to tell us!
            </h2>

            <form
              onSubmit={handleSubmit}
              className="bg-(--color-brown-100) gap-10 flex flex-col"
            >
              {/* Issue */}
              <div>
                <label className="block text-sm mb-1">Issue</label>
                <InputBar
                  type="text"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Enter your issue."
                  className=""
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm mb-1">Description</label>
                <div className="relative mb-4">
                  <textarea
                    type="textarea"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Please describe ..."
                    className="
                            h-49 
                            w-full 
                            border 
                            rounded-lg 
                            px-3 
                            py-3 
                            pr-4            
                            border-gray-400
                            outline-none
                            focus:border-purple-500
                            placeholder:text-gray-600"
                    rows={4}
                    cols={40}
                    maxLength={100}
                  />
                </div>
              </div>
              {/* Error */}
              {/* {error && <p className="text-red-500 text-sm mb-3">{error}</p>} */}

              {/* Submit */}
              <PrimaryButton
                type="submit"
                className="w-25.5 bg-red-500 text-white rounded-full py-3 mb-4"
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

