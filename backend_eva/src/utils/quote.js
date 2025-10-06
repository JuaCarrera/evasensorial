// utils/quote.js
const quoteIdent = (id) =>
  /^[a-z_][a-z0-9_]*$/i.test(id) ? id : `"${id.replace(/"/g, '""')}"`;

module.exports = { quoteIdent };
