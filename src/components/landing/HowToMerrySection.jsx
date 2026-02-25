export default function HowToMerrySection() {
  const howToSteps = [
    {
      icon: "/merry_icon/icon-smiling-face-with-sunglasses.svg",
      alt: "smiling face with sunglasses icon",
      title: "Upload your cool picture",
      description: "Lorem ipsum is a placeholder text",
    },
    {
      icon: "/merry_icon/icon-star-struck.svg",
      alt: "star struck icon",
      title: "Explore and find the one you like",
      description: "Lorem ipsum is a placeholder text",
    },
    {
      icon: "/merry_icon/icon-partying-face.svg",
      alt: "partying face icon",
      title: "Click 'Merry' for get to know!",
      description: "Lorem ipsum is a placeholder text",
    },
    {
      icon: "/merry_icon/icon-face-blowing-a-kiss.svg",
      alt: "face blowing a kiss icon",
      title: "Start chating and relationship",
      description: "Lorem ipsum is a placeholder text",
    },
  ];

  return (
    <section id="how-to-merry" className="pb-20 pt-30 lg:py-10 bg-utility-bg">
      <div className="mx-auto w-[343px] max-w-[1120px] text-center text-utility-white gap-12 lg:w-full lg:p-6">
        <h2 className="text-headline2 text-purple-300">How to Merry</h2>

        <div className="mt-10 flex flex-col gap-6 lg:mt-12 lg:grid lg:grid-cols-4">
          {howToSteps.map((step) => (
            <div
              key={step.title}
              className="flex flex-col items-center rounded-[40px] bg-purple-900 p-8 text-center gap-10"
            >
              <div className="flex size-30 items-center justify-center rounded-full bg-purple-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={step.icon} alt={step.alt} className="size-[50px]" />
              </div>
              <div className="flex flex-col items-center justify-center p-0.5 gap-3">
                <h4 className="text-headline4 text-utility-white">
                  {step.title}
                </h4>
                <p className="text-body2 text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}