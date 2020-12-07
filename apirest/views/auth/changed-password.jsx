import React from 'react'
import DefaultLayout from '../layouts/default'

export default (props) => (
  <DefaultLayout>
    <div className={`notification is-${props.success ? 'success' : 'warning'}`}>
      {props.success ? (
        `🎉 Votre mot de passe Swag a été changé avec succès. Hâte de vous retrouver dans l'app !`
      ) : (
        `😔 Votre mot de passe n'a pas pu être actualisé.`
      )}
    </div>
  </DefaultLayout>
)
