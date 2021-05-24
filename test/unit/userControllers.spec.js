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
  getAllUsers, createUser, updateUser, deleteUser, getUser
} = require('../../src/controllers/userControllers');
const { mockRequest } = require('../utils/mockRequest');
const { mockResponse } = require('../utils/mockResponse');
const { ROLES } = require('../../src/utils/constants/roles');
const { CustomError } = require('../../src/errors/CustomError');

chai.use(sinonChai);
const { expect } = chai;

describe('User Controllers', () => {
  const user = {
    username: 'Tester',
    password: 'password'
  };
  let users = [];
  const token = 'signedjwt';

  before(() => {
    stub(User, 'create').callsFake(userData => {
      const { username, password } = userData;
      if (!username || !password) {
        throw new Error('Username or password missing');
      }
      const savedUser = {
        username,
        password,
        role: ROLES.User,
        id: new mongoose.Types.ObjectId(),
        save: stub().resolves(true),
      };
      users.push(savedUser);
      return {
        exec: stub().resolves(savedUser)
      };
    });
    stub(User, 'deleteOne').callsFake(function (userData) {
      const { username } = userData;
      if (!username) {
        throw new Error('Username missing');
      }
      users = users.filter(dbEntry => dbEntry.username !== username);
      return {
        exec: stub().resolves(this)
      };
    });
    stub(User, 'find').returns({
      select: stub().returns({
        exec: stub().resolves(users)
      })
    });
    stub(User, 'findOne').callsFake(userData => {
      const { username } = userData;
      if (!username) {
        throw new Error('Username missing');
      }
      return {
        select: stub().returns({
          exec: stub().resolves(users.find(dbEntry => dbEntry.username === username))
        }),
        exec: stub().resolves(users.find(dbEntry => dbEntry.username === username))
      };
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

  describe('Get user', () => {
    it('should throw a not found error if the user does not exist', async () => {
      const req = mockRequest({ params: { username: user.username } });
      const res = mockResponse();
      try {
        await getUser(req, res);
        throw new Error('Function did not throw');
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(404);
        expect(err.message).to.eq('User not found');
      }
    });

    it('should throw a forbidden error if the accessing user is not the account owner or an administrator', async () => {
      let req = mockRequest({ body: { username: user.username, password: user.password } });
      let res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      req = mockRequest({ params: { username: user.username }, user: { username: 'AnotherUser' } });
      res = mockResponse();
      try {
        await getUser(req, res);
        throw new Error('Function did not throw');
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(403);
        expect(err.message).to.eq('You are not authorized to access this route');
      }
    });

    it("should return a user's details", async () => {
      let req = mockRequest({ body: { username: user.username, password: user.password } });
      let res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      req = mockRequest({ params: { username: user.username }, user: { username: user.username } });
      res = mockResponse();
      await getUser(req, res);
      expect(res.status).to.have.been.calledWith(200);
      const returnedUser = res.json.args[0][0].user;
      expect(returnedUser.username).to.eq(user.username);
    });
  });

  describe('Create user', () => {
    it('should throw a bad request error if a user with that username already exists', async () => {
      const req = mockRequest({ body: { username: user.username, password: user.password } });
      const res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      resetHistory();
      try {
        await createUser(req, res);
        throw new Error('Function did not throw');
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(400);
        expect(err.message).to.eq('A user with that username already exists');
      }
    });

    it('should create a user and return it', async () => {
      const req = mockRequest({ body: { username: user.username, password: user.password } });
      const res = mockResponse();
      await createUser(req, res);
      expect(User.create).to.have.been.called;
      expect(res.status).to.have.been.calledWith(201);
      const returnedUser = res.json.args[0][0].user;
      expect(returnedUser.username).to.eq(user.username);
      expect(users.length).to.eq(1);
    });
  });

  describe('Update user', () => {
    it('should throw a forbidden error if the updating user is not an administrator nor the owner of the account', async () => {
      let req = mockRequest({ body: { username: user.username, password: user.password } });
      let res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      const newPassword = 'newPassword';
      req = mockRequest({
        params: { username: user.username },
        body: { password: newPassword },
        user: { username: 'MaliciousUser', role: ROLES.User }
      });
      res = mockResponse();
      await updateUser(req, res).catch(err => {
        expect(err.statusCode).to.eq(403);
        expect(err.message).to.eq('You are not authorized to access this route');
      });

      req = mockRequest({
        params: { username: user.username },
        body: { role: ROLES.Administrator },
        user: { username: 'MaliciousUser', role: ROLES.User }
      });
      res = mockResponse();
      await updateUser(req, res).catch(err => {
        expect(err.statusCode).to.eq(403);
        expect(err.message).to.eq('You are not authorized to access this route');
      });
    });

    it("should update a user's password", async () => {
      let req = mockRequest({ body: { username: user.username, password: user.password } });
      let res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      const newPassword = 'newPassword';
      req = mockRequest({
        params: { username: user.username },
        body: { password: newPassword },
        user: { username: user.username, role: ROLES.User }
      });
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

      req = mockRequest({
        params: { username: user.username },
        body: { role: ROLES.Administrator },
        user: { role: ROLES.Administrator }
      });
      res = mockResponse();
      await updateUser(req, res);
      const updatedUser = users.find(dbEntry => dbEntry.username === user.username);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ user: { ...updatedUser, role: ROLES.Administrator } }));
    });
  });

  describe('Delete user', () => {
    it('should remove a user from the database', async () => {
      let req = mockRequest({ body: { username: user.username, password: user.password } });
      let res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      const deletedUser = users[0];
      req = mockRequest({
        params: { username: user.username },
        user: { username: user.username }
      });
      res = mockResponse();
      await deleteUser(req, res);
      expect(User.deleteOne).to.have.been.called;
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ message: 'User deleted successfully' }));
      expect(users).to.not.include(deletedUser);
    });
  });
});
