'use strict';

const { ROLES } = require('../utils/constants/roles');

function adminRoleCheck(req, res, next) {
  if (req.user.role !== ROLES.Administrator) {
    return res.status(403).json({ message: 'You are not authorized to access this route' });
  }
  return next();
}

module.exports = {
  adminRoleCheck
};
