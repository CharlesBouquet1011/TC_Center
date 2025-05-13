import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import Header_login from '../Header_login/Header_login';


function Register({ onRegister, onBackToLogin }) {

  const navigate = useNavigate();
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateEmail = (email) => {
    return email.endsWith('@insa-lyon.fr');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(credentials.email)) {
      setError('L\'adresse email doit se terminer par @insa-lyon.fr');
      return;
    }

    if (credentials.password !== credentials.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      // TODO: Replace with actual API call
      // For now, we'll use a mock registration
      onRegister(credentials.email);
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription');
    }
  };

  return (
    <>
    <div className="header">
      <Header_login />
    </div>
    <div className="login-container">
      <div className="login-box">
        <h1>Inscription</h1>
        <form onSubmit={handleSubmit}>
            
          <div className="form-group">
            <label htmlFor="email">Email INSA Lyon</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="exemple@insa-lyon.fr"
              required
            />
            <small className="email-hint">L'adresse email doit se terminer par @insa-lyon.fr</small>
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={credentials.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-button">
            S'inscrire
          </button>
          <div className="form-footer">
            <button type="button" onClick={() => navigate('/login')} className="link-button">
              Déjà un compte ? Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

export default Register; 