const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const hashPassword = async (password) => {
  const bcrypt = require('bcrypt');
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(password, hashedPassword);
};

const formatDate = (date) => {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
};

module.exports = {
  generateRandomString,
  validateEmail,
  validatePhone,
  hashPassword,
  comparePassword,
  formatDate
};