'use strict';

const chai = require('chai');
const {
  match,
  stub,
  restore,
  resetHistory,
} = require('sinon');
const sinonChai = require('sinon-chai');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../../src/models/User');
const {
  getAllUsers, createUser, updateUser, deleteUser
} = require('../../src/controllers/userControllers');
const { mockRequest } = require('../utils/mockRequest');
const { mockResponse } = require('../utils/mockResponse');

chai.use(sinonChai);
const { expect } = chai;

describe('User Controllers', () => {
  const user = {
    username: 'Tester',
    role: 'user',
    password: 'password'
  };
  let users = [];
  const token = 'signedjwt';

  before(() => {
    stub(User, 'create').callsFake(userData => new Promise((resolve, reject) => {
      const { username, password } = userData;
      if (!username || !password) {
        return reject(new Error('Username or password missing'));
      }
      const savedUser = {
        username,
        password,
        role: 'user',
        id: new mongoose.Types.ObjectId(),
        save: stub().resolves(true)
      };
      users.push(savedUser);
      return resolve(savedUser);
    }));
    stub(User, 'deleteOne').callsFake(userData => {
      const { username } = userData;
      if (!username) {
        throw new Error('Username missing');
      }
      users = users.filter(dbEntry => dbEntry.username !== username);
      return true;
    });
    stub(User, 'find').resolves(users);
    stub(User, 'findOne').callsFake(userData => {
      const { username } = userData;
      if (!username) {
        throw new Error('Username missing');
      }
      return users.find(dbEntry => dbEntry.username === username);
    });
    stub(jwt, 'sign').returns(token);
  });

  beforeEach(() => {
    while (users.length !== 0) {
      users.pop();
    }
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

  describe('Update user', () => {
    it('should return a 403 status if the updating user is not an administrator nor the owner of the account', async () => {
      let req = mockRequest({ body: { username: user.username, password: user.password } });
      let res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      const newPassword = 'newPassword';
      req = mockRequest({ params: { username: user.username }, body: { password: newPassword }, user: { username: 'MaliciousUser', role: 'user' } });
      res = mockResponse();
      await updateUser(req, res);
      expect(res.status).to.have.been.calledWith(403);
      expect(res.json).to.have.been.calledWith(match({ message: 'You are not authorized to access this route' }));

      const adminRole = 'administrator';
      req = mockRequest({ params: { username: user.username }, body: { role: adminRole }, user: { username: 'MaliciousUser', role: 'user' } });
      res = mockResponse();
      await updateUser(req, res);
      expect(res.status).to.have.been.calledWith(403);
      expect(res.json).to.have.been.calledWith(match({ message: 'You are not authorized to access this route' }));
    });

    it("should update a user's password", async () => {
      let req = mockRequest({ body: { username: user.username, password: user.password } });
      let res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      const newPassword = 'newPassword';
      req = mockRequest({ params: { username: user.username }, body: { password: newPassword }, user: { username: user.username, role: 'user' } });
      res = mockResponse();
      await updateUser(req, res);
      const updatedUser = users.find(dbEntry => dbEntry.username === user.username);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ user: { ...updatedUser, password: newPassword } }));
    });

    it("should update a user's role if the updating user is an administrator", async () => {
      let req = mockRequest({ body: { username: user.username, password: user.password } });
      let res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      const adminRole = 'administrator';
      req = mockRequest({ params: { username: user.username }, body: { role: adminRole }, user: { role: adminRole } });
      res = mockResponse();
      await updateUser(req, res);
      const updatedUser = users.find(dbEntry => dbEntry.username === user.username);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ user: { ...updatedUser, role: adminRole } }));
    });
  });

  describe('Delete user', () => {
    it('should remove a user from the database', async () => {
      let req = mockRequest({ body: { username: user.username, password: user.password } });
      let res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      const deletedUser = users[0];
      req = mockRequest({ params: { username: user.username } });
      res = mockResponse();
      await deleteUser(req, res);
      expect(User.deleteOne).to.have.been.called;
      expect(res.status).to.have.been.calledWith(200);
      expect(res.end).to.have.been.called;
      expect(users).to.not.include(deletedUser);
    });
  });
});
