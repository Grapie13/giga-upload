'use strict';

const chai = require('chai');
const {
  match,
  stub,
  restore,
  resetHistory
} = require('sinon');
const sinonChai = require('sinon-chai');
const jwt = require('jsonwebtoken');
const { User } = require('../../src/models/User');
const { createUser } = require('../../src/controllers/userControllers');
const { mockRequest } = require('../utils/mockRequest');
const { mockResponse } = require('../utils/mockResponse');

chai.use(sinonChai);
const { expect } = chai;

describe('User Controllers', () => {
  const user = {
    username: 'Tester',
    password: 'password'
  };
  const token = 'signedjwt';

  before(() => {
    stub(User, 'create').resolves({ ...user, id: 1 });
    stub(jwt, 'sign').returns(token);
  });

  beforeEach(() => {
    resetHistory();
  });

  after(() => {
    restore();
  });

  describe('Create user', () => {
    it('should create a user and return a JSON web token', async () => {
      const req = mockRequest({ body: { username: user.username, password: user.password } });
      const res = mockResponse();
      await createUser(req, res);
      expect(User.create).to.have.been.called;
      expect(res.status).to.have.been.calledWith(201);
      expect(res.json).to.have.been.calledWith(match({ token }));
    });
  });
});
