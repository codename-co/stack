import React from 'react'
import DefaultLayout from '../layouts/default'

const scripts = (
  <script dangerouslySetInnerHTML={{ __html: `
    document.forms[0].submit()
  ` }} />
)

export default (props) => (
  <DefaultLayout foot={scripts}>
    <form method='POST'>
      <div className='field'>
        <label className='label'>Jeton</label>
        <div className='control'>
          <input className='input' placeholder='Jeton' value={props.confirmation_token} disabled />
        </div>
      </div>
      <div className='field is-grouped'>
        <div className='control'>
          <button className='button is-success'>Confirmer</button>
        </div>
      </div>
    </form>
  </DefaultLayout>
)
