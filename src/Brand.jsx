import React from 'react';
export default function Brand(){
  return <div className="brand"><img className="company-logo" src={`${process.env.PUBLIC_URL}/ecotonofl-logo.jpg`} alt="EcotonoFL" width="104" height="78"/><div>ECO<span>GO</span></div></div>;
}
