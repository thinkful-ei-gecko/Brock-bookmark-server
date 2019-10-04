const app = require('../src/app');
const knex = require('knex');
const { makeBookmarksArray } = require('./bookmarks-fixtures');

describe('Bookmarks endpoints', () => {
  let db;

  const testBookmarks = makeBookmarksArray();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect from db', () => {
    db.destroy();
    console.log('DB DONE');
  });

  before('clean the table', () => db('bookmarks').truncate() );

  afterEach('cleanup', () => db('bookmarks').truncate() );

  context('/GET request', () => {
    it('should return an empty array when no data is present', () => {
      const expected = [];
      return supertest(app)
        .get('/bookmarks')
        .expect(200)
        .then( empty => expect(empty.body).to.eql(expected));
    });

    context('/GET requests with data', () => {
      beforeEach('add data to bookmarks test db', () => db.into('bookmarks').insert(testBookmarks) );

      it('should resolve with all bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200, testBookmarks);
      });

      it('should resolve with bookmark with certain id', () => {
        return supertest(app)
          .get('/bookmarks/2')
          .expect(200)
          .then( bookmark => {
            expect(bookmark.body.id).to.equal(2);
          });
      });

      it('should reject with a 404 if bookmark id is not in db', () => {
        return supertest(app)
          .get('/bookmarks/20')
          .expect(404);
      });
    });
  });

  context('/POST request', () => {
    it('creates an new bookmark, responds with 201 and the new bookmark', () => {
      const newBookmark = {
        title: 'Test Post',
        url: 'https://www.imatest.com',
        description: 'Hello I am a test',
        rating: 3
      };

      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .expect(201)
        .expect( res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
        });
    });
  });

  describe('DELETE /bookmarks/:id', () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach('Insert bookmarks', () => {
      return db
        .into('bookmarks')
        .insert(testBookmarks);
    });

    context('given no bookmarks', () => {
      it('responds 404 when bookmark does not exist', () => {
        return supertest(app)
          .delete('/bookmarks/123')
          .expect(404, {
            error: { message: 'bookmark not found'}
          });
      });
    });

    context('Given that there are bookmarks in the database', () => {

      it.skip('Removes the bookmark by ID from the database', () => {
        const idToRemove = 2;
        const expectedBookmarks = testBookmarks.filter(bm => bm.id !== idToRemove);
        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .expect(204)
          .then (() => {
            supertest(app)
              .get('/bookmarks')
              .expect(expectedBookmarks);
          });
      });
    });
  });
});