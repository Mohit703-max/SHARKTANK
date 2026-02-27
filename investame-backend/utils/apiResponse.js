/**
 * Sends a standardized success JSON response.
 *
 * @param {Response} res
 * @param {number}   statusCode
 * @param {string}   message
 * @param {*}        data
 * @param {object}   [meta]      - Pagination or extra metadata
 */
const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  const payload = { status: 'success', message };
  if (data !== null) payload.data = data;
  if (meta !== null) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess };
