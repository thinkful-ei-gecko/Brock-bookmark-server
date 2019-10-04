const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
const xss = require('xss');
//const { bookmarks } = require('../store');
//const { PORT } = require('../config');
const BookmarksService = require('./bookmarks-service');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
});

bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks);
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;

    if (!title) {
      logger.error('Title is required');
      return res
        .status(400)
        .send('Invalid data');
    }

    if (!url) {
      logger.error('URL is required');
      return res
        .status(400)
        .send('Invalid data');
    }

    const newBookmark = {
      title,
      url,
      description,
      rating
    };

    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        logger.info(`Bookmark with id ${bookmark.id} created.`);
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark));
      })
      .catch(next);
  });

bookmarksRouter
  .route('/:bookmark_id')
  .get((req, res, next) => {
    const { bookmark_id } = req.params;
    //make sure we found a bookmark

    BookmarksService.getById(req.app.get('db'), bookmark_id)
      .then (bookmark => {
        if (!bookmark) {
          console.log('get route happened')
          logger.error(`Bookmark with id ${bookmark_id} not found.`);
          return res
            .status(404)
            .send('Bookmark Not Found');
        }

        res.json(bookmark);
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    const { bookmark_id } = req.params;
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      bookmark_id
    )
      .then(numRowsAffected => {
        logger.info(`Bookmark with id ${bookmark_id} deleted.`);
        res.status(204).end();
      })
      .catch(next);
  });


module.exports = bookmarksRouter;