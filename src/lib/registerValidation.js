const NAME_MAX_LENGTH = 24;
const USERNAME_MIN_LENGTH = 6;
const PASSWORD_MIN_LENGTH = 8;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_AGE_YEARS = 18;

export const STEP_ONE_ERROR_MESSAGES = {
  nameRequired: "This name is required",
  nameMax: "Name must not exceed 24 characters",
  dateRequired: "This date is required",
  dateMinAge: "You must be at least 18 years old",
  locationRequired: "This location is required",
  cityRequired: "This city is required",
  usernameRequired: "This username is required",
  usernameMin: "Username must be at least 6 characters",
  emailRequired: "This email is required",
  emailInvalid: "Please enter a valid email address",
  passwordRequired: "This password is required",
  passwordMin: "Password must be at least 8 characters",
  confirmPasswordRequired: "This confirm password is required",
  passwordMismatch: "Passwords do not match",
};

export const STEP_TWO_ERROR_MESSAGES = {
  sexualIdentityRequired: "Sexual identity is required",
  sexualPreferenceRequired: "Sexual preference is required",
  racialPreferenceRequired: "Racial preference is required",
  meetingInterestRequired: "Meeting interest is required",
  hobbiesRequired: "Please add at least one hobby or interest",
  hobbiesMax: "You can select at most 10 hobbies",
};

export const STEP_THREE_ERROR_MESSAGES = {
  photosMin: "Please upload at least 2 photos",
};

/**
 * @param {{ name?: string; date?: unknown; location?: string; city?: string; username?: string; email?: string; password?: string; confirmPassword?: string }} data
 * @returns {{ valid: boolean; errors: Record<string, string> }}
 */
export function validateStep1(data) {
  const errors = {};

  if (!data.name?.trim()) errors.name = STEP_ONE_ERROR_MESSAGES.nameRequired;
  else if (data.name.length > NAME_MAX_LENGTH)
    errors.name = STEP_ONE_ERROR_MESSAGES.nameMax;

  if (data.date == null || data.date === "") {
    errors.date = STEP_ONE_ERROR_MESSAGES.dateRequired;
  } else {
    const birth = data.date instanceof Date ? data.date : new Date(data.date);
    if (Number.isNaN(birth.getTime())) {
      errors.date = STEP_ONE_ERROR_MESSAGES.dateRequired;
    } else {
      const today = new Date();
      const cutoff = new Date(today.getFullYear() - MIN_AGE_YEARS, today.getMonth(), today.getDate());
      const birthDay = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());
      if (birthDay > cutoff) {
        errors.date = STEP_ONE_ERROR_MESSAGES.dateMinAge;
      }
    }
  }

  if (!data.location?.trim())
    errors.location = STEP_ONE_ERROR_MESSAGES.locationRequired;

  if (!data.city?.trim()) errors.city = STEP_ONE_ERROR_MESSAGES.cityRequired;

  if (!data.username?.trim())
    errors.username = STEP_ONE_ERROR_MESSAGES.usernameRequired;
  else if (data.username.length < USERNAME_MIN_LENGTH)
    errors.username = STEP_ONE_ERROR_MESSAGES.usernameMin;

  if (!data.email?.trim()) errors.email = STEP_ONE_ERROR_MESSAGES.emailRequired;
  else if (!EMAIL_REGEX.test(data.email.trim()))
    errors.email = STEP_ONE_ERROR_MESSAGES.emailInvalid;

  if (!data.password) errors.password = STEP_ONE_ERROR_MESSAGES.passwordRequired;
  else if (data.password.length < PASSWORD_MIN_LENGTH)
    errors.password = STEP_ONE_ERROR_MESSAGES.passwordMin;

  if (!data.confirmPassword)
    errors.confirmPassword = STEP_ONE_ERROR_MESSAGES.confirmPasswordRequired;
  else if (data.password !== data.confirmPassword)
    errors.confirmPassword = STEP_ONE_ERROR_MESSAGES.passwordMismatch;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * @param {{ sexualIdentity?: string; sexualPreference?: string; racialPreference?: string; meetingInterest?: string; hobbies?: string[] }} data
 * @returns {{ valid: boolean; errors: Record<string, string> }}
 */
export function validateStep2(data) {
  const errors = {};
  const msg = STEP_TWO_ERROR_MESSAGES;

  if (!data.sexualIdentity?.trim()) errors.sexualIdentity = msg.sexualIdentityRequired;
  if (!data.sexualPreference?.trim()) errors.sexualPreference = msg.sexualPreferenceRequired;
  if (!data.racialPreference?.trim()) errors.racialPreference = msg.racialPreferenceRequired;
  if (!data.meetingInterest?.trim()) errors.meetingInterest = msg.meetingInterestRequired;
  if (!Array.isArray(data.hobbies) || data.hobbies.length === 0)
    errors.hobbies = msg.hobbiesRequired;
  else if (data.hobbies.length > 10)
    errors.hobbies = msg.hobbiesMax;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

const PHOTOS_MIN_COUNT = 2;

/**
 * @param {{ photos?: (File | string | null)[] }} data
 * @returns {{ valid: boolean; errors: Record<string, string> }}
 */
export function validateStep3(data) {
  const errors = {};
  const filled = Array.isArray(data.photos)
    ? data.photos.filter((p) => p != null).length
    : 0;
  if (filled < PHOTOS_MIN_COUNT) {
    errors.photos = STEP_THREE_ERROR_MESSAGES.photosMin;
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export { NAME_MAX_LENGTH, USERNAME_MIN_LENGTH, PASSWORD_MIN_LENGTH };
