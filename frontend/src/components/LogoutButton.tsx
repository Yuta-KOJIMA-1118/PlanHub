// src/components/LogoutButton.tsx (例)
import React from 'react';
import axios from 'axios';

const LogoutButton: React.FC = () => {
  const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const handleLogout = async () => {
    try {
      await axios.delete(`${backendURL}/users/sign_out`, { withCredentials: true });
      console.log('ログアウト成功');
      alert('ログアウトしました。');
      window.location.href = '/'; // ログアウト後にトップページへ
    } catch (error: any) {
      console.error('ログアウト失敗', error.response?.data || error.message);
      alert('ログアウトに失敗しました。');
    }
  };

  return (
    <button onClick={handleLogout}>ログアウト</button>
  );
};

export default LogoutButton;