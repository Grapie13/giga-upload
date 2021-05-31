'use strict';

const chai = require('chai');
const { stub, spy, restore } = require('sinon');
const sinonChai = require('sinon-chai');
const jwt = require('jsonwebtoken');
const { authorizationCheck } = require('../../src/middleware/authorizationCheck');
const { User } = require('../../src/models/User');
const { CustomError } = require('../../src/errors/CustomError');
const { mockRequest } = require('./utils/mockRequest');
const { mockResponse } = require('./utils/mockResponse');

chai.use(sinonChai);
const { expect } = chai;

describe('Authorization Check', () => {
  const token = 'goodtoken';
  const bearerToken = `Bearer ${token}`;
  const user = {
    id: 1,
    username: 'Tester'
  };

  before(() => {
    stub(jwt, 'verify').callsFake(inputToken => {
      if (inputToken === token) {
        return {
          id: user.id,
          username: user.username
        };
      }
      throw new Error('Invalid token');
    });
    stub(User, 'findOne').resolves(user);
  });

  after(() => {
    restore();
  });

  it('should call next with a forbidden error if no token is provided', async () => {
    const req = mockRequest({ get: stub().returns(undefined) });
    const res = mockResponse();
    const next = spy();
    await authorizationCheck(req, res, next);
    expect(next).to.have.been.called;
    const error = next.args[0][0];
    expect(error).to.be.an.instanceof(CustomError);
    expect(error.statusCode).to.eq(403);
    expect(error.message).to.eq('You are not authorized to access this route');
  });

  it('should call next with a forbidden error if the token is invalid', async () => {
    const req = mockRequest({ get: stub().returns('badToken') });
    const res = mockResponse();
    const next = spy();
    await authorizationCheck(req, res, next);
    expect(next).to.have.been.called;
    const error = next.args[0][0];
    expect(error).to.be.an.instanceof(CustomError);
    expect(error.statusCode).to.eq(403);
    expect(error.message).to.eq('You are not authorized to access this route');
  });

  it('should set req.user and call next without any parameters if the token is valid', async () => {
    const req = mockRequest({ get: stub().returns(bearerToken) });
    const res = mockResponse();
    const next = spy();
    await authorizationCheck(req, res, next);
    expect(next).to.have.been.called;
    expect(req.user).not.to.be.undefined;
    expect(req.user.id).to.eq(user.id);
    expect(req.user.username).to.eq(user.username);
  });
});
