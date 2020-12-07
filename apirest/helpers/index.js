const { Client } = require('pg')

async function query (...args) {
  const client = new Client(process.env.DATABASE_URL)
  await client.connect()
  const res = await client.query(...args)
  await client.end()
  return res.rows
}

async function findUserByConfirmationToken (token) {
  const rows = await query('SELECT * FROM swag.users WHERE confirmation_token = $1 AND deleted_at IS NULL', [token])

  return rows && rows[0]
}

module.exports = {
  query,
  findUserByConfirmationToken,
}
