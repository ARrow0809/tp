import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (userId: string) => void;
}

// 実際のパスワード: "tagp0622"
// 簡易的なハッシュ化の代わりに直接比較
const CORRECT_PASSWORD = "tagp0622";

const SecureLoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      setError('ユーザーIDを入力してください');
      return;
    }
    
    // 簡易的な実装として、直接パスワードを比較
    if (password === CORRECT_PASSWORD) {
      // ログイン成功時の処理
      localStorage.setItem("userId", userId);
      localStorage.setItem("login", "true");
      
      // ログイン時刻と有効期限を保存（24時間）
      const loginTime = new Date().getTime();
      const expiryTime = loginTime + (24 * 60 * 60 * 1000); // 24時間後
      localStorage.setItem("loginTime", loginTime.toString());
      localStorage.setItem("expiryTime", expiryTime.toString());
      
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
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
        <p>このログイン機能はフロントエンドのみで実装されています。</p>
        <p>実運用では、バックエンドと連携した認証システムを使用することをお勧めします。</p>
      </div>
    </div>
  );
};

export default SecureLoginScreen;