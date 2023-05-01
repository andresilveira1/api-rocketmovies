const AppError = require('../utils/AppError')
const knex = require('../database/knex')
const { hash, compare } = require('bcryptjs')

class UsersController {
  async create(request, response) {
    const { name, email, password } = request.body

    const userEmailExists = await knex('users')
      .where('email', '=', email)
      .first()

    if (userEmailExists) {
      throw new AppError('E-mail já cadastrado!')
    }

    const hashedPassword = await hash(password, 8)

    const registerUser = {
      name,
      email,
      password: hashedPassword
    }

    await knex('users').insert(registerUser)

    return response.status(201).json()
  }

  async update(request, response) {
    const { name, email, password, old_password } = request.body
    const { id } = request.params

    const user = await knex('users').where('id', '=', id).first()
    const userEmailExists = await knex('users')
      .where('email', '=', email)
      .first()

    if (!user) {
      throw new AppError('Usuário não encontrado!')
    }

    if (userEmailExists && userEmailExists.id !== user.id) {
      throw new AppError('Já existe um usuário com esse email!')
    }

    if (password && !old_password) {
      throw new AppError(
        'Você precisa informar a senha antiga para definir a nova senha.'
      )
    }

    if (password && old_password) {
      const checkOldPassword = await compare(old_password, user.password)

      if (!checkOldPassword) {
        throw new AppError('A senha antiga não confere.')
      }
      this.hashedPassword = await hash(password, 8)
    }

    const updateUser = {
      name,
      email,
      password: this.hashedPassword,
      updated_at: knex.fn.now()
    }

    await knex('users').where({ id }).update(updateUser)

    return response.json()
  }
}

module.exports = UsersController
