'use strict';

const chai = require('chai');
const {
  match,
  stub,
  restore,
  resetHistory,
} = require('sinon');
const sinonChai = require('sinon-chai');
const mongoose = require('mongoose');
const { promises: fs } = require('fs');
const { File } = require('../../src/models/File');
const {
  getFile,
  getFiles,
  getUserFiles,
  createFile,
  deleteFile
} = require('../../src/controllers/fileControllers');
const { mockRequest } = require('./utils/mockRequest');
const { mockResponse } = require('./utils/mockResponse');
const { CustomError } = require('../../src/errors/CustomError');
const { FailedTest } = require('./utils/FailedTest');
const { ROLES } = require('../../src/utils/constants/roles');

chai.use(sinonChai);
const { expect } = chai;

describe('File Controllers', () => {
  const id = new mongoose.Types.ObjectId();
  const file = {
    filename: 'TestFile.jpg',
    path: 'E:\\Test\\TestFile.jpg',
    owner: id,
    encoding: '7bit',
    mimetype: 'image/jpeg'
  };
  const user = {
    id,
    username: 'Tester',
    role: ROLES.User
  };
  let files = [];

  before(() => {
    stub(File, 'find').callsFake(fileData => {
      const owner = fileData?.owner;
      return {
        populate: stub().returns({
          exec: stub().resolves(
            owner ? files.filter(dbEntry => dbEntry.owner === owner) : files
          )
        }),
        exec: stub().resolves(
          owner ? files.filter(dbEntry => dbEntry.owner === owner) : files
        )
      };
    });
    stub(File, 'findOne').callsFake(fileData => {
      const fileId = fileData._id;
      if (!fileId) {
        throw new Error('ID is missing');
      }
      return {
        populate: stub().returns({
          exec: stub().resolves(files.find(dbEntry => dbEntry.id === fileId))
        }),
        exec: stub().resolves(files.find(dbEntry => dbEntry.id === fileId))
      };
    });
    stub(File, 'create').callsFake(fileData => {
      const newFile = {
        ...fileData,
        id: new mongoose.Types.ObjectId(),
      };
      newFile.populate = stub().returns({
        execPopulate: stub().resolves(newFile)
      });
      files.push(newFile);
      return newFile;
    });
    stub(File, 'deleteOne').callsFake(fileData => {
      const fileId = fileData._id;
      if (!fileId) {
        throw new Error('ID is missing');
      }
      files = files.filter(dbEntry => dbEntry.id !== fileId);
      return {
        exec: stub().resolves(true)
      };
    });
    stub(fs, 'rm').resolves(true);
  });

  beforeEach(() => {
    while (files.length !== 0) {
      files.pop();
    }
    resetHistory();
  });

  after(() => {
    restore();
  });

  async function createTestFile(fileData) {
    const req = mockRequest({
      file: {
        filename: fileData.filename,
        filePath: fileData.path,
        encoding: fileData.encoding,
        mimetype: fileData.mimetype
      },
      user: {
        id: fileData.owner
      }
    });
    const res = mockResponse();
    await createFile(req, res);
    expect(res.status).to.have.been.calledWith(201);
    return res.json.args[0][0].file;
  }

  describe('Get files', () => {
    it('should return an empty array if there are no files in the database', async () => {
      const req = mockRequest();
      const res = mockResponse();
      await getFiles(req, res);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ files: [] }));
    });

    it('should return a list of all files in the database', async () => {
      await createTestFile({ ...file });

      const req = mockRequest();
      const res = mockResponse();
      await getFiles(req, res);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ files }));
    });
  });

  describe('Get file', () => {
    it('should throw a not found error if the file does not exist', async () => {
      const req = mockRequest({ params: { fileId: 'Doesnotexist' } });
      const res = mockResponse();
      try {
        await getFile(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(404);
        expect(err.message).to.eq('File not found');
      }
    });

    it('should return a file', async () => {
      const testFile = await createTestFile({ ...file });

      const req = mockRequest({ params: { fileId: testFile.id } });
      const res = mockResponse();
      await getFile(req, res);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ file: testFile }));
      const returnedFile = res.json.args[0][0].file;
      expect(returnedFile.filename).to.eq(file.filename);
      expect(returnedFile.path).to.eq(file.path);
      expect(returnedFile.owner).to.eq(file.owner);
      expect(returnedFile.mimetype).to.eq(file.mimetype);
      expect(returnedFile.encoding).to.eq(file.encoding);
    });
  });

  describe('Get user files', () => {
    it('should throw a forbidden error if the accessing user is not the owner nor an administrator', async () => {
      const req = mockRequest({ params: { username: user.username }, user: { username: 'MaliciousUser', role: ROLES.User } });
      const res = mockResponse();
      try {
        await getUserFiles(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(403);
        expect(err.message).to.eq('You are not authorized to access this route');
      }
    });

    it("should return an array of user's files if the accessing user is an administrator", async () => {
      await createTestFile({ ...file });

      const req = mockRequest({ params: { username: user.username }, user: { username: user.username, id: user.id } });
      const res = mockResponse();
      await getUserFiles(req, res);
      expect(res.status).to.have.been.calledWith(200);
      const returnedFiles = res.json.args[0][0].files;
      expect(returnedFiles.length).to.eq(1);
      expect(returnedFiles[0].owner.toString()).to.eq(user.id.toString());
      expect(returnedFiles[0].filename).to.eq(file.filename);
    });
  });

  describe('Create file', () => {
    it('should create and return a new file', async () => {
      const req = mockRequest({
        file: {
          owner: user.id,
          filename: file.filename,
          mimetype: file.mimetype,
          encoding: file.encoding,
          filePath: file.path
        },
        user: {
          id: user.id
        }
      });
      const res = mockResponse();
      await createFile(req, res);
      expect(res.status).to.have.been.calledWith(201);
      const returnedFile = res.json.args[0][0].file;
      expect(returnedFile.owner).to.eq(user.id);
      expect(returnedFile.filename).to.eq(file.filename);
      expect(returnedFile.path).to.eq(file.path);
      expect(returnedFile.encoding).to.eq(file.encoding);
      expect(returnedFile.mimetype).to.eq(file.mimetype);
    });
  });

  describe('Delete file', () => {
    it('should throw a not found error if a file does not exist', async () => {
      const req = mockRequest({ params: { fileId: 'BadID' } });
      const res = mockResponse();
      try {
        await deleteFile(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(404);
        expect(err.message).to.eq('File not found');
      }
    });

    it('should delete a file and return a message', async () => {
      const testFile = await createTestFile({ ...file });

      const req = mockRequest({ params: { fileId: testFile.id } });
      const res = mockResponse();
      await deleteFile(req, res);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ message: 'File deleted successfully' }));
    });
  });
});
