import React from 'react'

export default (props) => (
  <>
    <link rel='stylesheet' href='https://unpkg.com/bulma@0.9' />
    {props.head}
    <div className='section'>
      <div className='container'>
        <figure className='image is-128x128'>
          <img src='/logo.png' />
        </figure>
        {props.children}
      </div>
    </div>
    {props.foot}
  </>
)
