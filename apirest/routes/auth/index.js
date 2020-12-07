const express = require('express')
const router = express.Router()

const { findUserByConfirmationToken, query } = require('../../helpers')

router.get('/forgot', (req, res, next) => {
  res.json({ foo: 'bar' })
})

router.get('/account-verify', (req, res, next) => {
  res.render('auth/account-verify', req.query)
})

router.post('/account-verify', async (req, res, next) => {
  const { confirmation_token } = req.query

  const ko = () => {
    res.render('auth/account-verified', { success: false })
  }

  const user = await findUserByConfirmationToken(confirmation_token)
  if (!user) {
    return ko()
  }

  const updated = await query(`SELECT user_confirm_registration($1);`, [user.email])
  if (!updated) {
    return ko()
  }

  res.render('auth/account-verified', { success: true })
})

router.get('/change-password', (req, res, next) => {
  res.render('auth/change-password', req.query)
})

router.post('/change-password', async (req, res, next) => {
  const { confirmation_token, password, password_confirmation } = req.body

  const ko = () => {
    res.render('auth/changed-password', { success: false })
  }

  const mandatoryParameters = confirmation_token && password && password === password_confirmation // TODO:
  if (!mandatoryParameters) {
    return ko()
  }
  const user = await findUserByConfirmationToken(confirmation_token)
  if (!user) {
    return ko()
  }

  const updated = await query(`SELECT user_change_pass_by_token($1, $2);`, [confirmation_token, password])
  if (!updated) {
    return ko()
  }

  res.render('auth/changed-password', { success: true })
})

module.exports = router
