// Password validation utility
export const validatePassword = (password) => {
  const requirements = [
    {
      test: (pass) => pass.length >= 8,
      message: 'Password must be at least 8 characters long'
    },
    {
      test: (pass) => /[A-Z]/.test(pass),
      message: 'Password must contain at least one uppercase letter'
    },
    {
      test: (pass) => /[a-z]/.test(pass),
      message: 'Password must contain at least one lowercase letter'
    },
    {
      test: (pass) => /\d/.test(pass),
      message: 'Password must contain at least one number'
    },
    {
      test: (pass) => /[!@#$%^&*(),.?":{}|<>]/.test(pass),
      message: 'Password must contain at least one special character'
    },
    {
      test: (pass) => !/(.)\1{2,}/.test(pass),
      message: 'Password must not contain repeating characters (3 or more times)'
    },
    {
      test: (pass) => !/^[A-Za-z]+$/.test(pass),
      message: 'Password must not contain only letters'
    },
    {
      test: (pass) => !/^[0-9]+$/.test(pass),
      message: 'Password must not contain only numbers'
    }
  ];

  const failedRequirements = requirements
    .filter(req => !req.test(password))
    .map(req => req.message);

  return {
    isValid: failedRequirements.length === 0,
    errors: failedRequirements
  };
};