'use strict';

const { expect } = require('chai');
const { spy } = require('sinon');
const { adminRoleCheck } = require('../../src/middleware/adminRoleCheck');
const { ROLES } = require('../../src/utils/constants/roles');
const { CustomError } = require('../../src/errors/CustomError');
const { mockRequest } = require('./utils/mockRequest');
const { mockResponse } = require('./utils/mockResponse');

describe('Admin Role Check', () => {
  it('should call next with a forbidden error if the user is not an administrator', async () => {
    const req = mockRequest({ user: { role: ROLES.User } });
    const res = mockResponse();
    const next = spy();
    await adminRoleCheck(req, res, next);
    expect(next).to.have.been.called;
    const error = next.args[0][0];
    expect(error).to.be.an.instanceof(CustomError);
    expect(error.statusCode).to.eq(403);
    expect(error.message).to.eq('You are not authorized to access this route');
  });

  it('should call next without any parameters if the user is an administrator', async () => {
    const req = mockRequest({ user: { role: ROLES.Administrator } });
    const res = mockResponse();
    const next = spy();
    await adminRoleCheck(req, res, next);
    expect(next).to.have.been.called;
    expect(next.args[0][0]).to.be.undefined;
  });
});
