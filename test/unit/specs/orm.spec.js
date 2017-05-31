import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import tmp from 'tmp'
// import fs from 'fs-extra'

import { createModel, RelationField } from '~/utils/orm'


chai.use(sinonChai)
var expect = chai.expect

describe('ORM and Models', () => {
  var dataDir = null
  var Author = null
  var Book = null

  beforeEach(done => {
    tmp.dir((err, path) => {
      dataDir = path
      
      class AuthorSchema {
        constructor() {
          this.id = String
          this.firstName = null
          this.lastName = 'defaultValue'
          this.phoneNumber = String
          this.age = 0
        }
      }

      Author = createModel('Author', AuthorSchema, {}, dataDir)

      class BookSchema {
        constructor() {
          this.id = String
          this.title = String
          this.author = new RelationField(Author)
        }
      }
      
      Book = createModel('Book', BookSchema, {}, dataDir)

      done(err)
    })
  })


  it('should save properly without id', () => {
    var a = new Author()
    a.fistName = 'Isaac'
    a.lastName = 'Asimov'
    a.phoneNumber = '012345'
    a.age = 80

    var insertSpy = sinon.spy(Author, 'insert')
    return a.save()
    .then(() => {
      expect(insertSpy).to.have.been.calledOnce
    })
  })

  it('should save properly with id', () => {
    var a = new Author()
    a.id = 'asimov'
    a.fistName = 'Isaac'
    a.lastName = 'Asimov'
    a.phoneNumber = '012345'
    a.age = 80

    var insertSpy = sinon.spy(Author, 'insert')
    a.save().then(() => {
      expect(insertSpy).to.have.been.calledOnce
      done()
    })
  })

  it('should have getters for relation fields', () => {
    var a = new Author()
    a.id = 'asimov'
    a.fistName = 'Isaac'
    a.lastName = 'Asimov'
    a.phoneNumber = '012345'
    a.age = 80

    
    return a.save()
    .then(() => {
      var b = new Book()
      b.id = 'foundation'
      b.title = 'Foundation'
      b.author = a
      return b.save()
    })
    .then(() => Book.findOne({id: 'foundation'}))
    .then(r => {
      r.getAuthor().then(author => {
        expect(author.id).to.equal('asimov')
        expect(author.fistName).to.equal('Isaac')
      })
    })
  })
})
