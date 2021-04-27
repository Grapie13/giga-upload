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
const mongoose = require('mongoose');
const { User } = require('../../src/models/User');
const { createUser, getAllUsers } = require('../../src/controllers/userControllers');
const { mockRequest } = require('../utils/mockRequest');
const { mockResponse } = require('../utils/mockResponse');

chai.use(sinonChai);
const { expect } = chai;

describe('User Controllers', () => {
  const user = {
    username: 'Tester',
    password: 'password'
  };
  const users = [];
  const token = 'signedjwt';

  before(() => {
    stub(User, 'create').callsFake(userData => {
      const { username, password } = userData;
      if (!username || !password) {
        throw new Error('Username or password missing');
      }
      const savedUser = { username, password, id: new mongoose.Types.ObjectId() };
      users.push(savedUser);
      return savedUser;
    });
    stub(User, 'find').resolves(users);
    stub(jwt, 'sign').returns(token);
  });

  beforeEach(() => {
    resetHistory();
  });

  after(() => {
    restore();
  });

  describe('Get all users', () => {
    it('should return an empty array if no users are in the database', async () => {
      const req = mockRequest();
      const res = mockResponse();
      await getAllUsers(req, res);
      expect(User.find).to.have.been.called;
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ users: [] }));
    });

    it('should return an array of existing users', async () => {
      let req = mockRequest({ body: { username: user.username, password: user.password } });
      let res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      req = mockRequest();
      res = mockResponse();
      await getAllUsers(req, res);
      expect(User.find).to.have.been.called;
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ users }));
    });
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
