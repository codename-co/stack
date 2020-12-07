import * as supertest from 'supertest'
import * as app from '../app'

const request = supertest(app)

describe('Index router', () => {
  it('Request / should return alive', async () => {
    const result = await request
      .get('/')
      .send()

    expect(result.status).toBe(200)
    expect(result.text).toBe('alive')
  })
})
