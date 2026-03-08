import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="callback">
      <div className="container">
        <div className="callback-card">
          <div className="spinner"></div>
          <p>Processing sign-in...</p>
        </div>
      </div>
    </div>
  );
}

export default AuthCallback;
