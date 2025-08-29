export const generateCode = (length: number): string => {
  if (process.env.NODE_ENV === 'development') return '123456';

  const charset = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return code;
};
