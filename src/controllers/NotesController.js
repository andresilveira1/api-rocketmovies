const knex = require('../database/knex')

class NotesController {
  async create(request, response) {
    const { title, description, rating, tags } = request.body
    const { user_id } = request.params

    const [note_id] = await knex('movie_notes').insert({
      title,
      description,
      rating,
      user_id
    })

    const tagsInsert = tags.map(tagname => {
      return {
        note_id,
        user_id,
        name: tagname
      }
    })

    await knex('movie_tags').insert(tagsInsert)

    response.json()
  }

  async show(request, response) {
    const { id } = request.params

    const note = await knex('movie_notes').where({ id }).first()
    const tag = await knex('movie_tags').where({ note_id: id }).orderBy('name')

    return response.json({ ...note, tag })
  }

  async delete(request, response) {
    const { id } = request.params

    await knex('movie_notes').where({ id }).delete()

    return response.json()
  }

  async index(request, response) {
    const { user_id, title, tags } = request.query

    let notes

    if (tags) {
      const filteredTags = tags.split(',').map(tags => tags.trim())

      notes = await knex('movie_tags')
        .select(['movie_notes.id', 'movie_notes.title', 'movie_notes.user_id'])
        .where('movie_notes.user_id', user_id)
        .whereLike('movie_notes.title', `%${title}%`)
        .whereIn('name', filteredTags)
        .innerJoin('movie_notes', 'movie_notes.id', 'movie_tags.note_id')
        .orderBy('movie_notes.title')
    } else {
      notes = await knex('movie_notes')
        .where({ user_id })
        .whereLike('title', `%${title}%`)
        .orderBy('title')
    }

    const userTags = await knex('movie_tags').where({ user_id })
    const notesWithTags = notes.map(note => {
      const noteTags = userTags.filter(tag => tag.note_id === note.id)

      return {
        ...note,
        tags: noteTags
      }
    })

    return response.json(notesWithTags)
  }
}

module.exports = NotesController
