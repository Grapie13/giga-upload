'use strict';

const { ROLES } = require('../utils/constants/roles');
const { ForbiddenError } = require('../errors/ForbiddenError');

function adminRoleCheck(req, res, next) {
  if (req.user.role !== ROLES.Administrator) {
    return next(new ForbiddenError());
  }
  return next();
}

module.exports = {
  adminRoleCheck
};
