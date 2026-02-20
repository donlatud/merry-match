import Link from "next/link";

const socialLinks = [
  {
    href: "https://facebook.com",
    icon: "/merry_icon/icon-facebook.svg",
    label: "Facebook",
  },
  {
    href: "https://instagram.com",
    icon: "/merry_icon/icon-instagram.svg",
    label: "Instagram",
  },
  {
    href: "https://twitter.com",
    icon: "/merry_icon/icon-twitter.svg",
    label: "Twitter",
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-100 ">
      <div className="w-full max-w-7xl lg:mx-auto p-6 lg:py-12 lg:px-40">
        {/* Desktop: Figma wrapper 1120×275*/}
        <div className="flex flex-col items-center text-center bg-transparent p-0 lg:w-full lg:max-w-[1120px] lg:mx-auto lg:h-72 lg:flex lg:flex-col lg:justify-between lg:items-center gap-10 lg:pb-4">
          {/* Logo + Tagline (top group) */}
          <div className="flex flex-col items-center">
            <Link
              href="/"
              className="flex items-center shrink-0 cursor-pointer"
            >
              <img
                src="/merry_icon/logo-merry-match.svg"
                alt="Merry Match"
                className="h-20 w-auto"
              />
            </Link>
            <p className="text-body1 text-gray-700 w-full">
              New generation of online dating website for everyone
            </p>
          </div>

          {/* Copyright + Social (bottom group)*/}
          <div className="flex flex-col items-center pt-6 px-0 border-t border-gray-300 w-full gap-6">
            <p className="mt-0 text-body4 text-gray-600">
              copyright ©2022 merrymatch.com All rights reserved
            </p>

            <div className="mt-0 flex items-center justify-center gap-4">
              {socialLinks.map(({ href, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden transition-opacity hover:opacity-90 cursor-pointer"
                  aria-label={label}
                >
                  <img
                    src={icon}
                    alt={label}
                    className="w-full h-full object-contain"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
