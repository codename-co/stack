import React from 'react'
import DefaultLayout from '../layouts/default'

export default (props) => (
  <DefaultLayout>
    <form method='POST' className='box'>
      <input type='hidden' name='confirmation_token' value={props.confirmation_token} />
      <div className='field'>
        <label className='label'>Mot de passe</label>
        <div className='control'>
          <input className='input' name='password' placeholder='Nouveau mot de passe' />
        </div>
      </div>
      <div className='field'>
        <label className='label'>Mot de passe (confirmation)</label>
        <div className='control'>
          <input className='input' name='password_confirmation' placeholder='Nouveau mot de passe' />
        </div>
      </div>
      <div className='field is-grouped'>
        <div className='control'>
          <button className='button is-success'>Enregistrer</button>
        </div>
      </div>
    </form>
  </DefaultLayout>
)
