// src/api/auth.ts
import axios from 'axios'

export const fetchCurrentUser = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/me', {
      withCredentials: true,
    });
    return response.data; // ログイン中ユーザーの情報
  } catch (error) {
    return null; // 未ログインの場合
  }
};
