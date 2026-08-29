const INTERNAL_SERVER_ERROR = 'Server error';

function sendInternalServerError(res) {
  return res.status(500).json({
    error: INTERNAL_SERVER_ERROR,
  });
}

function sendInternalServerFailure(res) {
  return res.status(500).json({
    success: false,
    message: INTERNAL_SERVER_ERROR,
  });
}

module.exports = {
  INTERNAL_SERVER_ERROR,
  sendInternalServerError,
  sendInternalServerFailure,
};
