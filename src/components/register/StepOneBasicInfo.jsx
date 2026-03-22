import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import InputBar from "@/components/commons/input/InputBar";
import DatePicker from "@/components/commons/input/DatePicker";
import DropdownBar from "@/components/commons/input/DropDownBar";
import PasswordInput from "@/components/commons/input/PasswordInput";
import { NAME_MAX_LENGTH } from "@/lib/registerValidation";

const ErrorIcon = () => (
  <Image
    src="/merry_icon/icon-exclamation.svg"
    className="shrink-0"
    alt=""
    width={16}
    height={16}
    aria-hidden
  />
);

const COUNTRIES_API = "https://countriesnow.space/api/v0.1/countries";

const defaultStep1Form = () => ({
  name: "",
  date: undefined,
  location: "",
  city: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
});

export const getDefaultStep1Form = defaultStep1Form;

export const StepOneBasicInfo = ({ formData = defaultStep1Form(), setFormData, errors = {} }) => {
  const [countriesData, setCountriesData] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLocationsLoading(true);
    axios
      .get(COUNTRIES_API)
      .then((res) => {
        const data = res?.data?.data;
        if (cancelled || !Array.isArray(data)) return;
        setCountriesData(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLocationsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const locationOptions = countriesData.map((d) => d.country).sort((a, b) => a.localeCompare(b));
  const selectedCountry = countriesData.find((d) => d.country === formData.location);
  const cityOptions = selectedCountry?.cities ?? [];

  const update = (field) => (value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleLocationChange = (value) => {
    setFormData((prev) => ({ ...prev, location: value, city: "" }));
  };

  return (
    <section
      className="flex flex-col gap-[24px] bg-utility-bg-main px-4 py-10 lg:px-6 lg:pt-0 lg:pb-4"
      aria-labelledby="basic-info-heading"
    >
      <div
        id="basic-info-heading"
        className="text-headline4  text-purple-500"
      >
        Basic Information
      </div>

      <form className="grid grid-cols-1 gap-[24px] lg:grid-cols-2 lg:gap-[40px]">
        <div className="grid gap-1">
          <div className="flex items-center gap-1">
            <label
              htmlFor="register-name"
              className="text-body2 font-normal text-foreground"
            >
              Name
            </label>
            {errors.name && <ErrorIcon />}
          </div>
          <InputBar
            id="register-name"
            type="text"
            value={formData.name}
            onChange={(e) => update("name")(e.target.value)}
            placeholder="Jon Snow"
            maxLength={NAME_MAX_LENGTH}
            error={!!errors.name}
            hideErrorIcon
            className="h-[48px]"
          />
          {errors.name && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div className="grid gap-1">
          <div className="flex items-center gap-1">
            <label
              htmlFor="register-dob"
              className="text-body2 font-normal text-foreground"
            >
              Date of birth
            </label>
            {errors.date && <ErrorIcon />}
          </div>
          <DatePicker
            label=""
            value={formData.date}
            onChange={update("date")}
            placeholder="Choose date"
            className="h-[48px]"
            error={!!errors.date}
            hideErrorIcon
            minAge={18}
          />
          {errors.date && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.date}
            </p>
          )}
        </div>

        <div className="grid gap-1">
          <div className="flex items-center gap-1">
            <label
              htmlFor="register-location"
              className="text-body2 font-normal text-foreground"
            >
              Location
            </label>
            {errors.location && <ErrorIcon />}
          </div>
          <DropdownBar
            value={formData.location}
            onChange={handleLocationChange}
            options={locationOptions}
            placeholder={locationsLoading ? "Loading..." : "Select your location"}
            className="h-[48px]"
            error={!!errors.location}
            disabled={locationsLoading}
            searchable
            hideErrorIcon
          />
          {errors.location && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.location}
            </p>
          )}
        </div>

        <div className="grid gap-1">
          <div className="flex items-center gap-1">
            <label
              htmlFor="register-city"
              className="text-body2 font-normal text-foreground"
            >
              City
            </label>
            {errors.city && <ErrorIcon />}
          </div>
          <DropdownBar
            value={formData.city}
            onChange={update("city")}
            options={cityOptions}
            placeholder={formData.location ? "Select your city" : "Select location first"}
            className="h-[48px]"
            error={!!errors.city}
            disabled={!formData.location}
            searchable
            hideErrorIcon
          />
          {errors.city && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.city}
            </p>
          )}
        </div>

        <div className="grid gap-1">
          <div className="flex items-center gap-1">
            <label
              htmlFor="register-username"
              className="text-body2 font-normal text-foreground"
            >
              Username
            </label>
            {errors.username && <ErrorIcon />}
          </div>
          <InputBar
            id="register-username"
            type="text"
            value={formData.username}
            onChange={(e) => update("username")(e.target.value)}
            placeholder="At least 6 character"
            error={!!errors.username}
            hideErrorIcon
            className="h-[48px]"
          />
          {errors.username && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.username}
            </p>
          )}
        </div>

        <div className="grid gap-1">
          <div className="flex items-center gap-1">
            <label
              htmlFor="register-email"
              className="text-body2 font-normal text-foreground"
            >
              Email
            </label>
            {errors.email && <ErrorIcon />}
          </div>
          <InputBar
            id="register-email"
            type="email"
            value={formData.email}
            onChange={(e) => update("email")(e.target.value)}
            placeholder="name@website.com"
            error={!!errors.email}
            hideErrorIcon
            className="h-[48px]"
          />
          {errors.email && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="grid gap-1">
          <div className="flex items-center gap-1">
            <label
              htmlFor="register-password"
              className="text-body2 font-normal text-foreground"
            >
              Password
            </label>
            {errors.password && <ErrorIcon />}
          </div>
          <PasswordInput
            id="register-password"
            value={formData.password}
            onChange={(e) => update("password")(e.target.value)}
            placeholder="At least 8 character"
            error={!!errors.password}
            className="h-[48px]"
          />
          {errors.password && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        <div className="grid gap-1">
          <div className="flex items-center gap-1">
            <label
              htmlFor="register-confirm-password"
              className="text-body2 font-normal text-foreground"
            >
              Confirm password
            </label>
            {errors.confirmPassword && <ErrorIcon />}
          </div>
          <PasswordInput
            id="register-confirm-password"
            value={formData.confirmPassword}
            onChange={(e) => update("confirmPassword")(e.target.value)}
            placeholder="At least 8 character"
            error={!!errors.confirmPassword}
            className="h-[48px]"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </form>
    </section>
  );
};
