import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (userId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // ハードコーディングされたパスワード - 本番環境では使用しないでください
  const PASSWORD = "tagp0622";
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      setError('ユーザーIDを入力してください');
      return;
    }
    
    if (password === PASSWORD) {
      // ログイン成功時の処理
      localStorage.setItem("userId", userId);
      localStorage.setItem("login", "true");
      onLogin(userId);
    } else {
      setError('パスワードが違います');
    }
  };
  
  return (
    <div className="login-container" style={{
      maxWidth: '400px',
      margin: '100px auto',
      padding: '20px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      borderRadius: '5px',
      backgroundColor: '#fff'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>ログイン</h2>
      
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffeeee', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="userId" style={{ display: 'block', marginBottom: '5px' }}>
            ユーザーID:
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            パスワード:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          />
        </div>
        
        <button 
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ログイン
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;