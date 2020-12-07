import React from 'react'
import DefaultLayout from '../layouts/default'

export default (props) => (
  <DefaultLayout>
    <div className={`notification is-${props.success ? 'success' : 'warning'}`}>
      {props.success ? (
        `🎉 Votre compte Swag est maintenant activé. Hâte de vous retrouver dans l'app !`
      ) : (
        `😔 Votre compte n'a pas pu être activé.`
      )}
    </div>
  </DefaultLayout>
)
