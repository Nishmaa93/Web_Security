interface StrengthCheck {
  test: (password: string) => boolean;
  score: number;
  message: string;
}

export const strengthChecks: StrengthCheck[] = [
  // Length checks
  {
    test: (pass) => pass.length >= 8,
    score: 10,
    message: 'Minimum length (8 characters)'
  },
  {
    test: (pass) => pass.length >= 12,
    score: 10,
    message: 'Good length (12+ characters)'
  },
  {
    test: (pass) => pass.length >= 16,
    score: 10,
    message: 'Excellent length (16+ characters)'
  },
  
  // Character type checks
  {
    test: (pass) => /[A-Z]/.test(pass),
    score: 10,
    message: 'Uppercase letter'
  },
  {
    test: (pass) => /[a-z]/.test(pass),
    score: 10,
    message: 'Lowercase letter'
  },
  {
    test: (pass) => /\d/.test(pass),
    score: 10,
    message: 'Number'
  },
  {
    test: (pass) => /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    score: 10,
    message: 'Special character'
  },
  
  // Advanced checks
  {
    test: (pass) => /(?=.*[A-Z].*[A-Z])/.test(pass),
    score: 5,
    message: 'Multiple uppercase letters'
  },
  {
    test: (pass) => /(?=.*[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>])/.test(pass),
    score: 5,
    message: 'Multiple special characters'
  },
  {
    test: (pass) => /(?=.*\d.*\d)/.test(pass),
    score: 5,
    message: 'Multiple numbers'
  },
  
  // Pattern checks
  {
    test: (pass) => !/^[A-Za-z]+$/.test(pass),
    score: 5,
    message: 'Not only letters'
  },
  {
    test: (pass) => !/^[0-9]+$/.test(pass),
    score: 5,
    message: 'Not only numbers'
  },
  {
    test: (pass) => !/(.)\1{2,}/.test(pass),
    score: 5,
    message: 'No character repetition'
  }
];

export const calculateStrength = (password: string) => {
  if (!password) return { score: 0, checks: [] };

  const passedChecks = strengthChecks.filter(check => check.test(password));
  const score = passedChecks.reduce((total, check) => total + check.score, 0);
  
  // Normalize score to 100
  const normalizedScore = Math.min(100, score);

  return {
    score: normalizedScore,
    checks: strengthChecks.map(check => ({
      message: check.message,
      passed: check.test(password)
    }))
  };
};

export const getStrengthColor = (score: number): string => {
  if (score < 40) return 'bg-red-500';
  if (score < 60) return 'bg-orange-500';
  if (score < 80) return 'bg-yellow-500';
  if (score < 90) return 'bg-lime-500';
  return 'bg-green-500';
};

export const getStrengthText = (score: number): string => {
  if (score < 40) return 'Very Weak';
  if (score < 60) return 'Weak';
  if (score < 80) return 'Medium';
  if (score < 90) return 'Strong';
  return 'Very Strong';
};

export const isPasswordValid = (password: string): boolean => {
  if (!password) return false;
  return password.length >= 8;
};