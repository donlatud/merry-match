"use client";
import Image from "next/image";
import DropdownBar from "@/components/commons/input/DropDownBar";
import MultiSelect from "@/components/commons/input/MultiSelect";

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

const SEXUAL_IDENTITY_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Trans man",
  "Trans woman",
  "Genderqueer",
  "Genderfluid",
  "Agender",
  "Prefer not to say",
  "Other",
];

const SEXUAL_PREFERENCE_OPTIONS = [
  "Women",
  "Men",
  "Men & women",
  "Non-binary people",
  "Everyone",
  "Same gender only",
  "Opposite gender only",
  "Prefer not to say",
  "Other",
];

const RACIAL_PREFERENCE_OPTIONS = [
  "Any",
  "Asian",
  "Black / African",
  "Latino / Hispanic",
  "Middle Eastern",
  "South Asian",
  "Southeast Asian",
  "East Asian",
  "White / Caucasian",
  "Mixed / Multi-ethnic",
  "Indigenous / Native",
  "Prefer not to say",
  "Other",
];

const MEETING_INTEREST_OPTIONS = [
  "Friends",
  "Dating",
  "Long-term relationship",
  "Short-term / casual",
  "Travel buddy",
  "Activity partner (sports, gym, etc.)",
  "Networking",
  "Language exchange",
  "Prefer not to say",
  "Other",
];
const HOBBY_OPTIONS = ["e-sport", "series", "dragon", "music", "travel", "sports", "reading", "gaming", "other", "none", "prefer not to say"];
const HOBBIES_MAX = 10;

const defaultStep2Form = () => ({
  sexualIdentity: "",
  sexualPreference: "",
  racialPreference: "",
  meetingInterest: "",
  hobbies: [],
});

export const getDefaultStep2Form = defaultStep2Form;

export const StepTwoInterests = ({
  formData = defaultStep2Form(),
  setFormData,
  errors = {},
}) => {
  const update = (field) => (value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const updateHobbies = (newHobbies) => {
    setFormData((prev) => ({
      ...prev,
      hobbies: Array.isArray(newHobbies) && newHobbies.length <= HOBBIES_MAX ? newHobbies : prev.hobbies,
    }));
  };

  return (
    <section
      className="flex flex-col gap-[24px] bg-utility-bg-main px-4 py-10 lg:px-6 lg:pt-0 lg:pb-6"
      aria-labelledby="interests-heading"
    >
      <div
        id="interests-heading"
        className="text-headline4 font-bold text-purple-500"
      >
        Identities and Interests
      </div>

      <form className="grid grid-cols-1 gap-[24px] lg:grid-cols-2 lg:gap-[40px]">
        <div className="grid gap-1 min-h-[76px]">
          <div className="flex items-center gap-1 h-[24px]">
            <label
              htmlFor="register-sexual-identities"
              className="text-body2 font-medium text-foreground"
            >
              Sexual identities
            </label>
            {errors.sexualIdentity && <ErrorIcon />}
          </div>
          <DropdownBar
            value={formData.sexualIdentity}
            onChange={update("sexualIdentity")}
            options={SEXUAL_IDENTITY_OPTIONS}
            placeholder="Select your sexual identity"
            className="h-[48px]"
            error={!!errors.sexualIdentity}
            hideErrorIcon
          />
          {errors.sexualIdentity && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.sexualIdentity}
            </p>
          )}
        </div>

        <div className="grid gap-1 min-h-[76px]">
          <div className="flex items-center gap-1 h-[24px]">
            <label
              htmlFor="register-sexual-preferences"
              className="text-body2 font-medium text-foreground"
            >
              Sexual preferences
            </label>
            {errors.sexualPreference && <ErrorIcon />}
          </div>
          <DropdownBar
            value={formData.sexualPreference}
            onChange={update("sexualPreference")}
            options={SEXUAL_PREFERENCE_OPTIONS}
            placeholder="Select your sexual preference"
            className="h-[48px]"
            error={!!errors.sexualPreference}
            hideErrorIcon
          />
          {errors.sexualPreference && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.sexualPreference}
            </p>
          )}
        </div>

        <div className="grid gap-1 min-h-[76px]">
          <div className="flex items-center gap-1 h-[24px]">
            <label
              htmlFor="register-racial-preferences"
              className="text-body2 font-medium text-foreground"
            >
              Racial preferences
            </label>
            {errors.racialPreference && <ErrorIcon />}
          </div>
          <DropdownBar
            value={formData.racialPreference}
            onChange={update("racialPreference")}
            options={RACIAL_PREFERENCE_OPTIONS}
            placeholder="Select your racial preference"
            className="h-[48px]"
            error={!!errors.racialPreference}
            hideErrorIcon
          />
          {errors.racialPreference && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.racialPreference}
            </p>
          )}
        </div>

        <div className="grid gap-1 min-h-[76px]">
          <div className="flex items-center gap-1 h-[24px]">
            <label
              htmlFor="register-meeting-interests"
              className="text-body2 font-medium text-foreground"
            >
              Meeting interests
            </label>
            {errors.meetingInterest && <ErrorIcon />}
          </div>
          <DropdownBar
            value={formData.meetingInterest}
            onChange={update("meetingInterest")}
            options={MEETING_INTEREST_OPTIONS}
            placeholder="Select your meeting interest"
            className="h-[48px]"
            error={!!errors.meetingInterest}
            hideErrorIcon
          />
          {errors.meetingInterest && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.meetingInterest}
            </p>
          )}
        </div>

        <div className="grid gap-1 min-h-[76px] lg:col-span-2">
          <div className="flex items-center gap-1 h-[24px]">
            <label
              htmlFor="register-hobbies"
              className="text-body2 font-medium text-foreground"
            >
              Hobbies / Interests (Maximum 10)
            </label>
            {errors.hobbies && <ErrorIcon />}
          </div>
          <MultiSelect
            label=""
            options={HOBBY_OPTIONS}
            value={formData.hobbies}
            onChange={updateHobbies}
            placeholder="Add hobbies or interests"
            error={!!errors.hobbies}
            hideErrorIcon
          />
          {errors.hobbies && (
            <p className="mt-1 text-body5 text-red-500" role="alert">
              {errors.hobbies}
            </p>
          )}
        </div>
      </form>
    </section>
  );
};
